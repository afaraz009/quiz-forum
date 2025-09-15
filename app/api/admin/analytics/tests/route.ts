import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get all published tests with their attempts
    const publishedTests = await prisma.publishedTest.findMany({
      where: {
        isPublished: true
      },
      include: {
        testAttempts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          where: {
            isCompleted: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    // Get total number of students (non-admin users)
    const totalStudents = await prisma.user.count({
      where: {
        isAdmin: false
      }
    })

    // Process analytics for each test
    const testsAnalytics = publishedTests.map(test => {
      const attempts = test.testAttempts
      const questions = JSON.parse(test.questions)
      const totalQuestions = questions.length

      // Calculate basic stats
      const completedAttempts = attempts.length
      const completionRate = totalStudents > 0 ? (completedAttempts / totalStudents) * 100 : 0

      // Calculate score statistics
      const scores = attempts.map(attempt => attempt.score || 0)
      const percentages = scores.map(score => (score / totalQuestions) * 100)

      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
      const averagePercentage = averageScore > 0 ? (averageScore / totalQuestions) * 100 : 0
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0

      // Calculate score distribution
      const scoreDistribution = [
        { range: '90-100%', count: 0, percentage: 0 },
        { range: '80-89%', count: 0, percentage: 0 },
        { range: '70-79%', count: 0, percentage: 0 },
        { range: '60-69%', count: 0, percentage: 0 },
        { range: '50-59%', count: 0, percentage: 0 },
        { range: '0-49%', count: 0, percentage: 0 }
      ]

      percentages.forEach(percentage => {
        if (percentage >= 90) scoreDistribution[0].count++
        else if (percentage >= 80) scoreDistribution[1].count++
        else if (percentage >= 70) scoreDistribution[2].count++
        else if (percentage >= 60) scoreDistribution[3].count++
        else if (percentage >= 50) scoreDistribution[4].count++
        else scoreDistribution[5].count++
      })

      // Calculate percentages for distribution
      scoreDistribution.forEach(dist => {
        dist.percentage = completedAttempts > 0 ? (dist.count / completedAttempts) * 100 : 0
      })

      // Calculate pass/fail statistics based on test's passing percentage
      const passingThreshold = test.passingPercentage || 60
      const passedAttempts = percentages.filter(percentage => percentage >= passingThreshold).length
      const failedAttempts = completedAttempts - passedAttempts
      const passRate = completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0

      // Get all attempts (sorted by most recent first)
      const recentAttempts = attempts
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .map(attempt => {
          const percentage = attempt.score ? (attempt.score / totalQuestions) * 100 : 0
          return {
            studentName: attempt.user.name || 'Unknown',
            studentEmail: attempt.user.email,
            score: attempt.score || 0,
            completedAt: attempt.completedAt!,
            percentage,
            passed: percentage >= passingThreshold
          }
        })

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        publishedAt: test.publishedAt,
        totalQuestions,
        totalStudents,
        completedAttempts,
        averageScore: averagePercentage,
        highestScore,
        lowestScore,
        completionRate,
        // Pass/fail statistics
        passingPercentage: passingThreshold,
        passedAttempts,
        failedAttempts,
        passRate,
        scoreDistribution: scoreDistribution.filter(dist => dist.count > 0), // Only include ranges with data
        recentAttempts
      }
    })

    return NextResponse.json({ testsAnalytics })
  } catch (error) {
    console.error('Error fetching test analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}