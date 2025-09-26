import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all sample prompts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const samplePrompts = await prisma.samplePrompt.findMany({
      where: search ? {
        title: {
          contains: search,
          mode: 'insensitive'
        }
      } : {},
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(samplePrompts)
  } catch (error) {
    console.error("Failed to fetch sample prompts:", error)
    return NextResponse.json(
      { error: "Failed to fetch sample prompts" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new sample prompt (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check authentication
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify admin status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Not authorized. Admin access required." }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, prompt } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt content is required" }, { status: 400 })
    }

    const samplePrompt = await prisma.samplePrompt.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        prompt: prompt.trim()
      }
    })

    return NextResponse.json(samplePrompt, { status: 201 })
  } catch (error) {
    console.error("Failed to create sample prompt:", error)
    return NextResponse.json(
      { error: "Failed to create sample prompt" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}