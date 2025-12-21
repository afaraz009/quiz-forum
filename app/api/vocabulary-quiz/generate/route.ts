import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateVocabularyQuiz } from "@/lib/vocabulary-utils"
import type { QuestionType } from "@/types/vocabulary"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { questionTypes, questionCount } = await request.json()

    // Validate inputs
    if (!questionTypes || !Array.isArray(questionTypes) || questionTypes.length === 0) {
      return NextResponse.json(
        { error: "At least one question type must be selected" },
        { status: 400 }
      )
    }

    if (!questionCount || questionCount < 1 || questionCount > 100) {
      return NextResponse.json(
        { error: "Question count must be between 1 and 100" },
        { status: 400 }
      )
    }

    // Validate question types
    const validTypes: QuestionType[] = ['word-to-meaning', 'word-to-urdu', 'word-to-usage']
    const invalidTypes = questionTypes.filter((type: string) => !validTypes.includes(type as QuestionType))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid question types: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch user's vocabulary entries
    const entries = await prisma.vocabularyEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Validate minimum entries
    if (entries.length < 4) {
      return NextResponse.json(
        { error: "You need at least 4 vocabulary entries to generate a quiz with multiple choice options" },
        { status: 400 }
      )
    }

    if (entries.length < questionCount) {
      return NextResponse.json(
        { error: `Not enough vocabulary entries. You have ${entries.length} entries but requested ${questionCount} questions` },
        { status: 400 }
      )
    }

    // Generate quiz questions
    const questions = generateVocabularyQuiz(
      entries,
      { questionTypes, questionCount },
      session.user.id
    )

    return NextResponse.json({
      questions,
      totalEntries: entries.length
    })
  } catch (error) {
    console.error("Generate vocabulary quiz error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
