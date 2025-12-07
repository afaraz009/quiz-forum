import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the specific test with all attempts
    const test = await prisma.publishedTest.findFirst({
      where: {
        id: params.id,
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
          },
          orderBy: {
            completedAt: 'desc'
          }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Parse questions
    const questions = JSON.parse(test.questions)
    const totalQuestions = questions.length

    // Process student attempts
    const attempts = test.testAttempts.map(attempt => {
      const answers = JSON.parse(attempt.answers || '{}')
      const timeTaken = attempt.completedAt && attempt.startedAt
        ? Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)
        : 0

      return {
        id: attempt.id,
        user: attempt.user,
        score: attempt.score || 0,
        answers,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt!,
        percentage: attempt.score ? (attempt.score / totalQuestions) * 100 : 0,
        timeTaken
      }
    })

    // Calculate analytics
    const totalAttempts = attempts.length
    const scores = attempts.map(attempt => attempt.score)
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
    const averagePercentage = averageScore > 0 ? (averageScore / totalQuestions) * 100 : 0
    const averageTimeTaken = attempts.length > 0
      ? attempts.reduce((sum, attempt) => sum + attempt.timeTaken, 0) / attempts.length
      : 0

    // Question-by-question analytics
    const questionAnalytics = questions.map((question: any, index: number) => {
      let correctCount = 0
      const wrongAnswers: { [key: string]: number } = {}

      attempts.forEach(attempt => {
        const userAnswer = attempt.answers[index.toString()]
        if (userAnswer) {
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correctCount++
          } else {
            wrongAnswers[userAnswer] = (wrongAnswers[userAnswer] || 0) + 1
          }
        }
      })

      const incorrectCount = totalAttempts - correctCount
      const accuracyRate = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0

      // Get top 3 most common wrong answers
      const commonWrongAnswers = Object.entries(wrongAnswers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([answer, count]) => ({ answer, count }))

      return {
        questionIndex: index,
        question: question.question,
        correctAnswer: question.correctAnswer,
        correctCount,
        incorrectCount,
        accuracyRate,
        commonWrongAnswers
      }
    })

    const response = {
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        questions,
        publishedAt: test.publishedAt,
        totalQuestions,
        timeLimit: test.timeLimit,
        dueDate: test.dueDate
      },
      attempts,
      analytics: {
        totalAttempts,
        averageScore,
        averagePercentage,
        averageTimeTaken,
        questionAnalytics
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching test details:', error)
    return NextResponse.json({ error: 'Failed to fetch test details' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}