"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, TrendingUp, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface VocabularyStatsCardProps {
  totalEntries: number
  lastUpdated: Date | null
}

export function VocabularyStatsCard({ totalEntries, lastUpdated }: VocabularyStatsCardProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Vocabulary Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Entries */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                📚
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {totalEntries}
                </p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {lastUpdated
                    ? formatDistanceToNow(lastUpdated, { addSuffix: true })
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Minimum for quiz</span>
            <span className="font-semibold">4 words</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Quiz ready</span>
            <span className={`font-semibold ${totalEntries >= 4 ? 'text-green-600' : 'text-orange-600'}`}>
              {totalEntries >= 4 ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Generate Quiz Button */}
        <Button
          onClick={() => router.push("/vocabulary/generate-quiz")}
          className="w-full"
          size="lg"
          disabled={totalEntries < 4}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Generate Vocabulary Quiz
        </Button>

        {totalEntries < 4 && (
          <p className="text-xs text-center text-muted-foreground">
            Add at least 4 vocabulary entries to generate a quiz
          </p>
        )}
      </CardContent>
    </Card>
  )
}
