"use client"

import { useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { Quiz } from "@/components/quiz"
import type { QuizQuestion } from "@/types/quiz"

export default function Page() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  const handleFileUpload = (questions: QuizQuestion[]) => {
    setQuestions(questions)
  }

  const handleReset = () => {
    setQuestions([])
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-screen py-12 bg-gray-100">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">Quiz App</h1>

      {!questions.length ? (
        <FileUploader onFileUpload={handleFileUpload} />
      ) : (
        <Quiz questions={questions} onReset={handleReset} />
      )}
    </main>
  )
}
