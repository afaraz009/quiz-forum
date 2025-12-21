import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const quiz = await prisma.vocabularyQuiz.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: "Vocabulary quiz not found" },
        { status: 404 }
      )
    }

    // Parse questions from JSON
    const questions = JSON.parse(quiz.questions)
    const questionTypes = JSON.parse(quiz.questionTypes)

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions,
        questionTypes,
        totalQuestions: quiz.totalQuestions,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt
      }
    })
  } catch (error) {
    console.error("Get vocabulary quiz error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if quiz exists and belongs to user
    const quiz = await prisma.vocabularyQuiz.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: "Vocabulary quiz not found" },
        { status: 404 }
      )
    }

    // Delete quiz (attempts will be cascade deleted)
    await prisma.vocabularyQuiz.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: "Vocabulary quiz deleted successfully"
    })
  } catch (error) {
    console.error("Delete vocabulary quiz error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
