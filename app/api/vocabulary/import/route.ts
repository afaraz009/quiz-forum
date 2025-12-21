import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseVocabularyCSV, findDuplicates } from "@/lib/vocabulary-utils"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { csvContent, mode } = await request.json()

    if (!csvContent) {
      return NextResponse.json(
        { error: "CSV content is required" },
        { status: 400 }
      )
    }

    // Parse CSV
    let parsedEntries
    try {
      parsedEntries = parseVocabularyCSV(csvContent)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to parse CSV" },
        { status: 400 }
      )
    }

    // Limit to 1000 entries per import
    if (parsedEntries.length > 1000) {
      return NextResponse.json(
        { error: "Cannot import more than 1000 entries at once" },
        { status: 400 }
      )
    }

    // Handle replace mode
    if (mode === 'replace') {
      await prisma.vocabularyEntry.deleteMany({
        where: { userId: session.user.id }
      })
    }

    // Get existing entries for duplicate checking
    const existingEntries = await prisma.vocabularyEntry.findMany({
      where: { userId: session.user.id }
    })

    // Filter out duplicates
    const stats = {
      added: 0,
      skipped: 0,
      errors: [] as string[]
    }

    const entriesToAdd = parsedEntries.filter((entry, index) => {
      const duplicate = findDuplicates(existingEntries, entry.word)
      if (duplicate) {
        stats.skipped++
        return false
      }
      return true
    })

    // Batch insert
    if (entriesToAdd.length > 0) {
      try {
        await prisma.vocabularyEntry.createMany({
          data: entriesToAdd.map(entry => ({
            ...entry,
            userId: session.user.id
          })),
          skipDuplicates: true
        })
        stats.added = entriesToAdd.length
      } catch (error) {
        console.error("Batch insert error:", error)
        stats.errors.push("Failed to insert some entries")
      }
    }

    return NextResponse.json({
      message: `Import completed: ${stats.added} added, ${stats.skipped} skipped`,
      stats
    })
  } catch (error) {
    console.error("Import vocabulary error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
