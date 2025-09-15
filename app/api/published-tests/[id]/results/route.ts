import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session to ensure user is authenticated
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Await params for Next.js 15 compatibility
    const { id } = await params

    // Fetch the published test
    const test = await prisma.publishedTest.findFirst({
      where: {
        id: id,
        isPublished: true
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found or not published' }, { status: 404 })
    }

    // Fetch the user's test attempt
    const attempt = await prisma.testAttempt.findFirst({
      where: {
        userId: user.id,
        publishedTestId: id
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'No test attempt found' }, { status: 404 })
    }

    // Parse questions and answers
    const questions = JSON.parse(test.questions)
    const answers = JSON.parse(attempt.answers)

    // Calculate percentage and pass/fail
    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100)
    const passed = percentage >= test.passingPercentage

    const resultData = {
      id: test.id,
      title: test.title,
      description: test.description,
      questions: questions,
      passingPercentage: test.passingPercentage,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        answers: answers,
        completedAt: attempt.completedAt?.toISOString(),
        startedAt: attempt.startedAt.toISOString()
      },
      passed: passed,
      percentage: percentage
    }

    return NextResponse.json(resultData)
  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json({ error: 'Failed to fetch test results' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}