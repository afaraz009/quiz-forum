import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { VocabularyQuizHistory } from "@/types/vocabulary"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Fetch all vocabulary quizzes with their attempts
    const quizzes = await prisma.vocabularyQuiz.findMany({
      where: { userId: session.user.id },
      include: {
        attempts: {
          orderBy: { completedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to history format with stats
    const history: VocabularyQuizHistory[] = quizzes.map(quiz => {
      const attempts = quiz.attempts
      const scores = attempts.map(a => a.score)

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        questionTypes: JSON.parse(quiz.questionTypes),
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        totalAttempts: attempts.length,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        latestScore: scores.length > 0 ? scores[0] : null,
        lastAttemptDate: attempts.length > 0 ? attempts[0].completedAt.toISOString() : null
      }
    })

    return NextResponse.json({ quizzes: history })
  } catch (error) {
    console.error("Get vocabulary quiz history error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
