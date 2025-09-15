import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch all published tests for admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const publishedTests = await prisma.publishedTest.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        testAttempts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(publishedTests)
  } catch (error) {
    console.error("Failed to fetch published tests:", error)
    return NextResponse.json(
      { error: "Failed to fetch published tests" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new published test
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      questions,
      totalQuestions,
      timeLimit,
      dueDate,
      allowLateSubmissions,
      isPublished,
      publishedAt
    } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Test title is required" }, { status: 400 })
    }

    if (!questions || totalQuestions <= 0) {
      return NextResponse.json({ error: "Test questions are required" }, { status: 400 })
    }

    // Validate JSON structure of questions
    try {
      const parsedQuestions = JSON.parse(questions)
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error("Questions must be a non-empty array")
      }
    } catch (err) {
      return NextResponse.json({ error: "Invalid questions format" }, { status: 400 })
    }

    const publishedTest = await prisma.publishedTest.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        questions,
        totalQuestions,
        timeLimit: timeLimit || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        allowLateSubmissions: allowLateSubmissions || false,
        isPublished: isPublished || false,
        publishedAt: isPublished && publishedAt ? new Date(publishedAt) : null,
        createdByUserId: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(publishedTest, { status: 201 })
  } catch (error) {
    console.error("Failed to create published test:", error)
    return NextResponse.json(
      { error: "Failed to create published test" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}