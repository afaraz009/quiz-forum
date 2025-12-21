"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, FileUp, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { parseVocabularyCSV } from "@/lib/vocabulary-utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VocabularyCSVUploaderProps {
  onImportSuccess: () => void
}

export function VocabularyCSVUploader({ onImportSuccess }: VocabularyCSVUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [csvContent, setCsvContent] = useState("")
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (file: File) => {
    try {
      setError(null)
      setPreviewData([])
      const text = await file.text()
      setCsvContent(text)

      // Parse and preview
      const entries = parseVocabularyCSV(text)
      setPreviewData(entries.slice(0, 5)) // Show first 5 rows

      toast({
        title: "CSV parsed successfully",
        description: `Found ${entries.length} valid entries. Review preview below.`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file")
      setPreviewData([])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        handleFileChange(file)
      } else {
        setError("Please upload a CSV file")
      }
    }
  }

  const handleImport = async () => {
    if (!csvContent) {
      setError("No CSV content to import")
      return
    }

    try {
      setIsImporting(true)
      setError(null)

      const response = await fetch("/api/vocabulary/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvContent,
          mode: "append",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Import successful!",
          description: `Added ${data.stats.added} entries. Skipped ${data.stats.skipped} duplicates.`,
        })

        // Reset form
        setCsvContent("")
        setPreviewData([])
        onImportSuccess()
      } else {
        setError(data.error || "Failed to import CSV")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileUp className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Drag and drop your CSV file here
            </p>
            <p className="text-sm text-muted-foreground">
              or click below to browse
            </p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0])
              }
            }}
            className="hidden"
            id="csv-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Choose CSV File
            </label>
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="font-medium mb-2">Expected CSV format:</p>
        <code className="text-xs">
          Word, Meaning/Definition, Urdu Translation, Usage in a Sentence
        </code>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      )}

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview (First 5 entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Meaning</TableHead>
                    <TableHead>Urdu Translation</TableHead>
                    <TableHead>Usage Example</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{entry.word}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.meaning}</TableCell>
                      <TableCell>{entry.urduTranslation}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.usageExample}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleImport}
                disabled={isImporting}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Vocabulary
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
