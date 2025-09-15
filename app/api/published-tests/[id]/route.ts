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

    // Fetch the published test
    const test = await prisma.publishedTest.findFirst({
      where: {
        id: params.id,
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
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found or not published' }, { status: 404 })
    }

    // Parse questions
    const questions = JSON.parse(test.questions)

    // Format the response
    const response = {
      id: test.id,
      title: test.title,
      description: test.description,
      questions: questions,
      timeLimit: test.timeLimit,
      createdBy: test.createdBy,
      hasAttempted: test.testAttempts.length > 0,
      canTakeTest: test.testAttempts.length === 0
    }

    return NextResponse.json({ test: response })
  } catch (error) {
    console.error('Error fetching published test:', error)
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}