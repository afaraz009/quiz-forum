"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { QuizQuestion } from "@/types/quiz"
import { AlertCircle, Copy, FileUp, Clipboard } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "Sample JSON has been copied to your clipboard",
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
      },
    )
  }

 
  const samplePrompt = `You are a quiz generator. Create a JSON array of multiple-choice quiz questions about translating Urdu sentences to English, focusing on verb tenses.

Each element in the array must follow this format:

{
  "question": "ترجمہ کریں: '<Urdu sentence here>'",
  "options": ["<English translation 1>", "<English translation 2>", "<English translation 3>", "<English translation 4>"],
  "correctAnswer": "<The correct English translation (must exactly match one from options)>"
}
- Guidelines:
-Generate 20 multiple-choice questions.
-Write each question in Urdu, starting with "ترجمہ کریں:" followed by a short, everyday Urdu sentence.
-Use ONLY the English tenses [Past Simple, Past Continuous, Past Perfect, Past Perfect Continuous] in the translation options.
-Provide four unique English translation options for each question, each reflecting a different tense from the specified list, with only one being the correct translation of the Urdu sentence.
-Add negative and interrogative forms in some questions.
-Shuffle the order of questions to avoid patterns (e.g., not grouping by tense).
-Shuffle the position of the correct answer in the options for each question.
-Shuffle the position of tenses in the options 
-Ensure the correct answer exactly matches one of the options.
-Output a valid JSON array containing the requested number of questions.
-Do not include explanations, comments, or extra text outside the JSON.
-Use clear, everyday Urdu sentences that are grammatically correct and natural.
-Ensure translations in the options are accurate and reflect the appropriate tense
`



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

      <div className="mt-6 flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">View Sample Prompt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Sample Prompt for LLM</DialogTitle>
              <DialogDescription>Copy this prompt to generate quiz questions with an AI assistant</DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-md border">
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{samplePrompt}</pre>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => copyToClipboard(samplePrompt)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Full Prompt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

     
    </div>
  )
}
