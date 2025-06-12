"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { QuizQuestion } from "@/types/quiz"
import { AlertCircle, Copy, FileUp, Clipboard } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
        throw new Error(`Question at index ${index} is missing required fields`)
      }

      // Check if it's an MCQ (has options)
      if (item.options) {
        if (!Array.isArray(item.options)) {
          throw new Error(`Options for question "${item.question}" must be an array`)
        }

        if (item.options.length !== 4) {
          throw new Error(`Question "${item.question}" must have exactly 4 options`)
        }

        if (!item.options.includes(item.correctAnswer)) {
          throw new Error(
            `Correct answer "${item.correctAnswer}" is not in the options for question "${item.question}"`,
          )
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
          description: "Text has been copied to your clipboard",
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
        question: "What is 2 + 2?",
        correctAnswer: "4",
      },
    ],
    null,
    2,
  )

  const samplePrompt = `Create a comprehensive learning quiz in JSON format. The quiz should include both multiple-choice questions and short answer translation questions. 

For multiple-choice questions, include the "options" array with exactly 4 possible 
For short answer questions, omit the "options" field.

 Format your response as a JSON array with the following structure:
[
  {
    "question": "Identify tense: 'She walks to school every day'?",
    "options": ["Present Simple", "Present Continuous", "Past Simple", "Past Continuous"],
    "correctAnswer": "Present Simple"
  },
  {
    "question": "Translate: 'میں روز اسکول جاتا ہوں'?",
    "correctAnswer": "I go to school everyday"
  },
  ...
]
Requirements:
- Create 6 questions where an English sentence is provided, and students must identify which tense it is (Present Simple, Present Continuous, Past Simple, or Past Continuous). 
- Tense identification should only be asked in MCQs
- Create 4 questions MCQ where an Urdu sentence is provided, and students must select  the correct English translation
- Create 4 short Answer questions for urdu to english translation
-  Ensure a balanced mix of all tenses with affirmative, negative, and interrogative examples
-  For Urdu translation MCQ questions: make sure the options include translations in different tenses
- Make sure each question has exactly 4 options
- For Urdu translation short questions: make sure the correct answer is provided in the answer
- Ensure the correct answer is always included among the options
- Use common everyday situations in all sentences`

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
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
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
                className="w-12 h-12 text-gray-400 mb-3"
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
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">JSON files only</p>
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

      <div className="mt-6 space-y-6">
        {/* Combined Format and Sample Section */}
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Expected JSON Format:</h3>
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => copyToClipboard(sampleJson)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <pre className="text-xs overflow-x-auto p-2 bg-gray-100 rounded mb-4">
            {`[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "Paris"
  },
  {
    "question": "What is 2 + 2?",
    "correctAnswer": "4"
  }
]`}
          </pre>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Sample Prompt for LLM:</h3>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => copyToClipboard(samplePrompt)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="text-xs p-2 bg-gray-100 rounded whitespace-pre-wrap">{samplePrompt}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
