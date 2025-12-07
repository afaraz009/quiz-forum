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

    const { quizId, folderId } = await request.json()

    if (!quizId) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      )
    }

    // Check if quiz exists and belongs to user
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        userId: session.user.id
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found or does not belong to you" },
        { status: 404 }
      )
    }

    // If folderId is provided, validate it
    if (folderId) {
      // @ts-ignore - Prisma client generation issue workaround
      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
          userId: session.user.id
        }
      })

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found or does not belong to you" },
          { status: 404 }
        )
      }
    }

    // Update the quiz with the new folder
    // @ts-ignore - Prisma client generation issue workaround
    const updatedQuiz = await prisma.quiz.update({
      where: {
        id: quizId
      },
      data: {
        // @ts-ignore - Prisma client generation issue workaround
        folderId: folderId || null
      }
    })

    return NextResponse.json({
      message: "Quiz moved successfully",
      quiz: updatedQuiz
    })
  } catch (error) {
    console.error("Move quiz error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}