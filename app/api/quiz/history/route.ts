import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        attempts: {
          where: {
            userId: session.user.id
          },
          orderBy: {
            completedAt: 'desc'
          }
        },
        // @ts-ignore - Prisma client generation issue workaround
        folder: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const quizHistory = quizzes.map(quiz => {
      const attempts = quiz.attempts
      const highestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0
      const latestAttempt = attempts[0]
      
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        totalAttempts: attempts.length,
        highestScore,
        latestScore: latestAttempt?.score || null,
        lastAttemptDate: latestAttempt?.completedAt || null,
        // @ts-ignore - Prisma client generation issue workaround
        folderId: quiz.folderId,
        // @ts-ignore - Prisma client generation issue workaround
        folder: quiz.folder ? {
          id: quiz.folder.id,
          name: quiz.folder.name,
          isDefault: quiz.folder.isDefault
        } : null
      }
    })

    // Also fetch folders for the user
    // @ts-ignore - Prisma client generation issue workaround
    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      quizzes: quizHistory,
      folders
    })
  } catch (error) {
    console.error("Fetch quiz history error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}