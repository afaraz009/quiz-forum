import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

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
      folders
    })
  } catch (error) {
    console.error("Get folders error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify that the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    })

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 404 }
      )
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      )
    }

    // Check if user already has a folder with this name
    // @ts-ignore - Prisma client generation issue workaround
    const existingFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        name: name.trim()
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists" },
        { status: 400 }
      )
    }

    // @ts-ignore - Prisma client generation issue workaround
    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        userId: session.user.id,
        isDefault: false
      }
    })

    return NextResponse.json({
      message: "Folder created successfully",
      folder
    })
  } catch (error) {
    console.error("Create folder error:", error)

    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: "User account not found. Please log out and log in again." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}