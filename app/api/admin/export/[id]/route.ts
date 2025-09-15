import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Get the test with all attempts
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

    const questions = JSON.parse(test.questions)
    const totalQuestions = questions.length

    // Generate CSV content
    const csvRows: string[] = []

    // Header row
    const headers = [
      'Student Name',
      'Email',
      'Score',
      'Percentage',
      'Completed At',
      'Time Taken (minutes)',
      'Started At'
    ]

    // Add question headers
    questions.forEach((question: any, index: number) => {
      headers.push(`Q${index + 1}: ${question.question.substring(0, 50)}...`)
      headers.push(`Q${index + 1} Answer`)
      headers.push(`Q${index + 1} Correct`)
    })

    csvRows.push(headers.join(','))

    // Data rows
    test.testAttempts.forEach(attempt => {
      const answers = JSON.parse(attempt.answers || '{}')
      const timeTaken = attempt.completedAt && attempt.startedAt
        ? Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)
        : 0

      const row = [
        `"${attempt.user.name || 'Unknown'}"`,
        `"${attempt.user.email}"`,
        attempt.score?.toString() || '0',
        ((attempt.score || 0) / totalQuestions * 100).toFixed(1) + '%',
        `"${new Date(attempt.completedAt!).toLocaleString()}"`,
        timeTaken.toString(),
        `"${new Date(attempt.startedAt!).toLocaleString()}"`
      ]

      // Add answers for each question
      questions.forEach((question: any, index: number) => {
        const userAnswer = answers[index.toString()] || 'No answer'
        const correctAnswer = question.correctAnswer
        const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

        row.push(`"${correctAnswer}"`) // The correct answer
        row.push(`"${userAnswer}"`) // Student's answer
        row.push(isCorrect ? 'TRUE' : 'FALSE') // Whether correct
      })

      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${test.title.replace(/\s+/g, '_')}_results.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting test results:', error)
    return NextResponse.json({ error: 'Failed to export results' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}