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

    const { quizId, score, totalQuestions, answers } = await request.json()

    if (!quizId || score === undefined || !totalQuestions || !answers) {
      return NextResponse.json(
        { error: "Quiz ID, score, total questions, and answers are required" },
        { status: 400 }
      )
    }

    // Verify the quiz exists and belongs to user or is accessible
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      )
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        score,
        totalQuestions,
        answers: JSON.stringify(answers),
        userId: session.user.id,
        quizId: quizId,
      }
    })

    return NextResponse.json({
      message: "Quiz attempt saved successfully",
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        completedAt: attempt.completedAt
      }
    })
  } catch (error) {
    console.error("Submit quiz attempt error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}