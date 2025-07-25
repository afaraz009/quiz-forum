import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import type { QuizQuestion } from "@/types/quiz"

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

    const { title, description, questions } = await request.json()

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Title and questions are required" },
        { status: 400 }
      )
    }

    // Validate questions format
    questions.forEach((q: any, index: number) => {
      if (!q.question || !q.correctAnswer) {
        throw new Error(`Question at index ${index} is missing required fields (question and correctAnswer)`)
      }
      
      // If options are provided, validate as MCQ
      if (q.options && (!Array.isArray(q.options) || q.options.length !== 4)) {
        throw new Error(`MCQ question at index ${index} must have exactly 4 options`)
      }
      
      // If options are provided, correct answer must be in options
      if (q.options && !q.options.includes(q.correctAnswer)) {
        throw new Error(`Correct answer for question at index ${index} must be included in options`)
      }
    })

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        questions: JSON.stringify(questions),
        totalQuestions: questions.length,
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      message: "Quiz saved successfully",
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        createdAt: quiz.createdAt
      }
    })
  } catch (error) {
    console.error("Save quiz error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}