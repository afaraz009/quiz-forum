import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get session to ensure user is authenticated
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the current user to check for existing attempts
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch all published tests with user's attempt status
    const publishedTests = await prisma.publishedTest.findMany({
      where: {
        isPublished: true
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        testAttempts: {
          where: {
            userId: user.id
          },
          select: {
            id: true,
            score: true,
            isCompleted: true,
            completedAt: true,
            startedAt: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    // Format the response to include attempt status
    const formattedTests = publishedTests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimit: test.timeLimit,
      dueDate: test.dueDate,
      allowLateSubmissions: test.allowLateSubmissions,
      createdBy: test.createdBy,
      publishedAt: test.publishedAt,
      totalQuestions: JSON.parse(test.questions).length,
      // User's attempt information
      hasAttempted: test.testAttempts.length > 0,
      attempt: test.testAttempts[0] || null, // There should only be one attempt per user per test
      // Status indicators
      canTakeTest: test.testAttempts.length === 0, // Can only take if no attempts
      isOverdue: test.dueDate ? new Date() > new Date(test.dueDate) : false
    }))

    return NextResponse.json({ publishedTests: formattedTests })
  } catch (error) {
    console.error('Error fetching published tests:', error)
    return NextResponse.json({ error: 'Failed to fetch published tests' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}