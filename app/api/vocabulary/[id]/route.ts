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

    const entry = await prisma.vocabularyEntry.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Vocabulary entry not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error("Get vocabulary entry error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { word, meaning, urduTranslation, usageExample } = await request.json()

    // Validate all fields
    if (!word || !meaning || !urduTranslation || !usageExample) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.vocabularyEntry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Vocabulary entry not found" },
        { status: 404 }
      )
    }

    // Update entry
    const entry = await prisma.vocabularyEntry.update({
      where: { id: params.id },
      data: {
        word: word.trim(),
        meaning: meaning.trim(),
        urduTranslation: urduTranslation.trim(),
        usageExample: usageExample.trim()
      }
    })

    return NextResponse.json({
      message: "Vocabulary entry updated successfully",
      entry
    })
  } catch (error) {
    console.error("Update vocabulary entry error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
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

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.vocabularyEntry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Vocabulary entry not found" },
        { status: 404 }
      )
    }

    // Delete entry
    await prisma.vocabularyEntry.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: "Vocabulary entry deleted successfully"
    })
  } catch (error) {
    console.error("Delete vocabulary entry error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
