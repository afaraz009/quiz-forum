import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch single sample prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const samplePrompt = await prisma.samplePrompt.findUnique({
      where: { id }
    })

    if (!samplePrompt) {
      return NextResponse.json({ error: "Sample prompt not found" }, { status: 404 })
    }

    return NextResponse.json(samplePrompt)
  } catch (error) {
    console.error("Failed to fetch sample prompt:", error)
    return NextResponse.json(
      { error: "Failed to fetch sample prompt" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update sample prompt (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { title, description, prompt } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt content is required" }, { status: 400 })
    }

    const samplePrompt = await prisma.samplePrompt.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        prompt: prompt.trim()
      }
    })

    return NextResponse.json(samplePrompt)
  } catch (error) {
    console.error("Failed to update sample prompt:", error)
    return NextResponse.json(
      { error: "Failed to update sample prompt" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Delete sample prompt (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    await prisma.samplePrompt.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Sample prompt deleted successfully" })
  } catch (error) {
    console.error("Failed to delete sample prompt:", error)
    return NextResponse.json(
      { error: "Failed to delete sample prompt" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}