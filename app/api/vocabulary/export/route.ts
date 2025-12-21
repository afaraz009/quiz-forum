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

    // Fetch all vocabulary entries for the user
    const entries = await prisma.vocabularyEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { word: 'asc' }
    })

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No vocabulary entries to export" },
        { status: 404 }
      )
    }

    // Generate CSV content
    const headers = ['Word', 'Meaning/Definition', 'Urdu Translation', 'Usage in a Sentence']
    const csvRows = [headers.join(',')]

    entries.forEach(entry => {
      const row = [
        escapeCSVField(entry.word),
        escapeCSVField(entry.meaning),
        escapeCSVField(entry.urduTranslation),
        escapeCSVField(entry.usageExample)
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vocabulary-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error("Export vocabulary error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Escape CSV field by wrapping in quotes and escaping internal quotes
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
