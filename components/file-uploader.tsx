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
        if (!Array.isArray(item.options) || item.options.length !== 4) {
          throw new Error(`MCQ question "${item.question}" must have exactly 4 options`)
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

  const sampleJson = JSON.stringify(
    [
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: "Paris",
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: "Mars",
      },
      {
        question: "What is the largest ocean on Earth?",
        correctAnswer: "Pacific Ocean",
      },
      {
        question: "In what year did World War II end?",
        correctAnswer: "1945",
      },
    ],
    null,
    2,
  )

  const samplePrompt = `Create a quiz with both multiple-choice questions (MCQ) and short answer questions. For MCQ questions, provide exactly 4 options. For short answer questions, omit the options field. Format your response as a JSON array with the following structure:

${sampleJson}

Please provide at least 5 questions on [TOPIC]. For MCQ questions, make sure the correct answer is included in the options array. For short answer questions, provide the exact answer expected.`

  return (
    <div className="w-full">
      <Tabs defaultValue="upload" className="w-full mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Paste JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".json"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0])
                }
              }}
            />
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
              <svg
                className="w-12 h-12 text-muted-foreground mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">JSON files only</p>
            </label>
          </div>

          <div className="mt-4 flex justify-center">
            <Button asChild>
              <label htmlFor="file-upload">Select JSON File</label>
            </Button>
          </div>
        </TabsContent>

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
              <Button variant="outline" onClick={() => copyToClipboard(sampleJson)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Sample JSON
              </Button>
              <Button onClick={() => copyToClipboard(samplePrompt)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Full Prompt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 p-4 border rounded-md bg-muted">
        <h3 className="text-sm font-medium mb-2 text-foreground">Expected JSON Format:</h3>
        <pre className="text-xs overflow-x-auto p-2 bg-background border rounded text-muted-foreground">
          {`[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "Paris"
  },
  {
    "question": "What is the largest ocean on Earth?",
    "correctAnswer": "Pacific Ocean"
  },
  ...
]`}
        </pre>
      </div>
    </div>
  )
}
