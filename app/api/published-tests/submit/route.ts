import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    // Parse request body
    const { testId, answers } = await request.json()

    if (!testId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the published test
    const test = await prisma.publishedTest.findFirst({
      where: {
        id: testId,
        isPublished: true
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found or not published' }, { status: 404 })
    }

    // Check if user has already attempted this test
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: user.id,
        publishedTestId: testId
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ error: 'You have already attempted this test' }, { status: 400 })
    }


    // Parse questions and calculate score
    const questions = JSON.parse(test.questions)
    let score = 0

    // Calculate score by comparing answers
    questions.forEach((question: any, index: number) => {
      const userAnswer = answers[index]
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        score++
      }
    })

    // Create test attempt record
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: user.id,
        publishedTestId: testId,
        answers: JSON.stringify(answers),
        score: score,
        isCompleted: true,
        completedAt: new Date(),
        startedAt: new Date() // For now, assume started when submitted
      }
    })

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score: score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100)
    })
  } catch (error) {
    console.error('Error submitting test attempt:', error)

    // Check if it's a unique constraint error (duplicate attempt)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already attempted this test' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to submit test attempt' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}