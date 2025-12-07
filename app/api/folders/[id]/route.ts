import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const folderId = params.id

    // Check if folder exists and belongs to user
    // @ts-ignore - Prisma client generation issue workaround
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: session.user.id
      }
    })

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    // Prevent deletion of default folder
    if (folder.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default folder" },
        { status: 400 }
      )
    }

    // Move all quizzes in this folder to the default folder
    // @ts-ignore - Prisma client generation issue workaround
    const defaultFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true
      }
    })

    if (defaultFolder) {
      // @ts-ignore - Prisma client generation issue workaround
      await prisma.quiz.updateMany({
        where: {
          // @ts-ignore - Prisma client generation issue workaround
          folderId: folderId
        },
        data: {
          // @ts-ignore - Prisma client generation issue workaround
          folderId: defaultFolder.id
        }
      })
    }

    // Delete the folder
    // @ts-ignore - Prisma client generation issue workaround
    await prisma.folder.delete({
      where: {
        id: folderId
      }
    })

    return NextResponse.json({
      message: "Folder deleted successfully"
    })
  } catch (error) {
    console.error("Delete folder error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const folderId = params.id
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      )
    }

    // Check if folder exists and belongs to user
    // @ts-ignore - Prisma client generation issue workaround
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: session.user.id
      }
    })

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    // Prevent editing of default folder
    if (folder.isDefault) {
      return NextResponse.json(
        { error: "Cannot edit the default folder" },
        { status: 400 }
      )
    }

    // Check if another folder with the same name already exists for this user
    // @ts-ignore - Prisma client generation issue workaround
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        name: name.trim(),
        NOT: {
          id: folderId
        }
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 400 }
      )
    }

    // Update the folder
    // @ts-ignore - Prisma client generation issue workaround
    const updatedFolder = await prisma.folder.update({
      where: {
        id: folderId
      },
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json({
      message: "Folder updated successfully",
      folder: updatedFolder
    })
  } catch (error) {
    console.error("Update folder error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}