import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        { error: "Quiz ID, score, totalQuestions, and answers are required" },
        { status: 400 }
      )
    }

    // Verify quiz exists and belongs to user
    const quiz = await prisma.vocabularyQuiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: "Vocabulary quiz not found" },
        { status: 404 }
      )
    }

    // Create attempt record
    const attempt = await prisma.vocabularyQuizAttempt.create({
      data: {
        score,
        totalQuestions,
        answers: JSON.stringify(answers),
        userId: session.user.id,
        quizId
      }
    })

    return NextResponse.json({
      message: "Vocabulary quiz attempt submitted successfully",
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        completedAt: attempt.completedAt
      }
    })
  } catch (error) {
    console.error("Submit vocabulary quiz error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
