import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findDuplicates } from "@/lib/vocabulary-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'word'
    const order = searchParams.get('order') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (search) {
      where.word = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = order

    // Fetch entries with pagination
    const [entries, total] = await Promise.all([
      prisma.vocabularyEntry.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.vocabularyEntry.count({ where })
    ])

    return NextResponse.json({
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Get vocabulary entries error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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

    const { word, meaning, urduTranslation, usageExample } = await request.json()

    // Validate all fields
    if (!word || !meaning || !urduTranslation || !usageExample) {
      return NextResponse.json(
        { error: "All fields are required (word, meaning, urduTranslation, usageExample)" },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existingEntries = await prisma.vocabularyEntry.findMany({
      where: { userId: session.user.id }
    })

    const duplicate = findDuplicates(existingEntries, word)
    if (duplicate) {
      return NextResponse.json(
        { error: `The word "${word}" already exists in your vocabulary` },
        { status: 409 }
      )
    }

    // Create entry
    const entry = await prisma.vocabularyEntry.create({
      data: {
        word: word.trim(),
        meaning: meaning.trim(),
        urduTranslation: urduTranslation.trim(),
        usageExample: usageExample.trim(),
        userId: session.user.id
      }
    })

    return NextResponse.json({
      message: "Vocabulary entry added successfully",
      entry
    })
  } catch (error) {
    console.error("Add vocabulary entry error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
