import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { testId } = await request.json()

    if (!testId) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      )
    }

    // Fetch the published test
    const publishedTest = await prisma.publishedTest.findUnique({
      where: {
        id: testId,
        isPublished: true
      }
    })

    if (!publishedTest) {
      return NextResponse.json(
        { error: "Published test not found" },
        { status: 404 }
      )
    }

    // Check if user has already saved this test by checking title and description pattern
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        userId: session.user.id,
        title: publishedTest.title,
        description: {
          contains: `(Saved from published test)`
        }
      }
    })

    if (existingQuiz) {
      return NextResponse.json(
        { message: "Test already saved", quiz: existingQuiz },
        { status: 200 }
      )
    }

    // Create a new quiz from the published test
    // Store the original test ID in the description for detection purposes
    const newQuiz = await prisma.quiz.create({
      data: {
        title: publishedTest.title,
        description: `${publishedTest.description ? publishedTest.description + " " : ""}(Saved from published test - ${testId})`,
        questions: publishedTest.questions,
        totalQuestions: publishedTest.totalQuestions,
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      message: "Test saved successfully",
      quiz: {
        id: newQuiz.id,
        title: newQuiz.title,
        description: newQuiz.description,
        totalQuestions: newQuiz.totalQuestions,
        createdAt: newQuiz.createdAt
      }
    })
  } catch (error) {
    console.error("Save published test error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}