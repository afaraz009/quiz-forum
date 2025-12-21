"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { VocabularyCSVUploader } from "@/components/vocabulary-csv-uploader"
import { VocabularyTable } from "@/components/vocabulary-table"
import { VocabularyStatsCard } from "@/components/vocabulary-stats-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Upload, Plus, Download } from "lucide-react"
import type { VocabularyEntry } from "@/types/vocabulary"
import { useToast } from "@/hooks/use-toast"

export default function VocabularyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchVocabularyEntries()
    }
  }, [status, router])

  const fetchVocabularyEntries = async () => {
    try {
      // Fetch all entries by setting a high limit
      const response = await fetch("/api/vocabulary?limit=10000")
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries)
        setTotalEntries(data.total) // Get the actual total from API
      }
    } catch (error) {
      console.error("Error fetching vocabulary entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/vocabulary/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `vocabulary-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success!",
          description: "Vocabulary exported successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to export vocabulary",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading vocabulary..." />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const lastUpdated =
    entries.length > 0
      ? new Date(
          Math.max(
            ...entries.map((e) => new Date(e.updatedAt || e.createdAt).getTime())
          )
        )
      : null

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 py-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
            📚 Vocabulary Library
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Manage Your Vocabulary
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build your personal vocabulary database, import from CSV, and generate custom quizzes
          </p>
        </div>

        {/* Quick Actions Card */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                ⚡
              </div>
              <div>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription className="text-base">
                  Manage your vocabulary entries
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                onClick={() => setShowUploader(!showUploader)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                {showUploader ? "Hide Import" : "Import CSV"}
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={totalEntries === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => router.push("/vocabulary/generate-quiz")}
                className="w-full"
                size="lg"
                disabled={totalEntries < 4}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CSV Uploader (conditional) */}
        {showUploader && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Import Vocabulary from CSV</CardTitle>
              <CardDescription>
                Upload a CSV file with your vocabulary entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VocabularyCSVUploader
                onImportSuccess={() => {
                  fetchVocabularyEntries()
                  setShowUploader(false)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Statistics Card */}
        <VocabularyStatsCard totalEntries={totalEntries} lastUpdated={lastUpdated} />

        {/* Vocabulary List Card */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                📖
              </div>
              <div>
                <CardTitle className="text-xl">Vocabulary Entries</CardTitle>
                <CardDescription className="text-base">
                  {totalEntries} word{totalEntries !== 1 ? "s" : ""} in your database
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <VocabularyTable entries={entries} onEntriesChange={fetchVocabularyEntries} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
