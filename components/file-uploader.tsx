"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { QuizQuestion } from "@/types/quiz"
import { AlertCircle, FileUp, Clipboard } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SamplePromptsTable } from "@/components/sample-prompts-table"

interface FileUploaderProps {
  onFileUpload: (questions: QuizQuestion[]) => void
}

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [jsonText, setJsonText] = useState("")
  const { toast } = useToast()

  const validateQuestions = (data: any): QuizQuestion[] => {
    if (!Array.isArray(data)) {
      throw new Error("JSON data must be an array of questions")
    }

    return data.map((item, index) => {
      if (!item.question || !item.correctAnswer) {
        throw new Error(`Question at index ${index} is missing required fields (question and correctAnswer)`)
      }

      // If options are provided, validate as MCQ
      if (item.options) {
        if (!Array.isArray(item.options) || item.options.length < 2) {
          throw new Error(`MCQ question "${item.question}" must have at least 2 options`)
        }

        if (!item.options.includes(item.correctAnswer)) {
          throw new Error(`Correct answer "${item.correctAnswer}" is not in the options for question "${item.question}"`)
        }
      }

      return {
        question: item.question,
        options: item.options,
        correctAnswer: item.correctAnswer,
      }
    })
  }

  const handleFileChange = async (file: File) => {
    try {
      setError(null)
      const text = await file.text()
      const data = JSON.parse(text)
      const validatedQuestions = validateQuestions(data)
      onFileUpload(validatedQuestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse JSON file")
    }
  }

  const handleJsonSubmit = () => {
    try {
      setError(null)
      if (!jsonText.trim()) {
        setError("Please enter JSON data")
        return
      }
      const data = JSON.parse(jsonText)
      const validatedQuestions = validateQuestions(data)
      onFileUpload(validatedQuestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse JSON text")
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
      if (file.type === "application/json") {
        handleFileChange(file)
      } else {
        setError("Please upload a JSON file")
      }
    }
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="paste" className="w-full mb-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="paste" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Paste JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste">
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your JSON here..."
              className="min-h-[200px] font-mono text-sm"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
            <Button onClick={handleJsonSubmit} className="w-full">
              Parse JSON
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        <SamplePromptsTable onPromptSelect={(prompt) => setJsonText(prompt)} />
      </div>

     
    </div>
  )
}
