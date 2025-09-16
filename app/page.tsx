"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { FileUploader } from "@/components/file-uploader"
import { Quiz } from "@/components/quiz"
import { QuizSaveDialog } from "@/components/quiz-save-dialog"
import type { QuizQuestion } from "@/types/quiz"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null)
  const [currentScore, setCurrentScore] = useState<number | undefined>(undefined)
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string> | undefined>(undefined)

  const handleFileUpload = (parsedQuestions: QuizQuestion[]) => {
    setQuestions(parsedQuestions)
    setIsLoaded(true)
    setSavedQuizId(null) // Reset saved quiz ID for new upload
    setCurrentScore(undefined)
    setCurrentAnswers(undefined)
  }

  const handleSaveQuiz = () => {
    setShowSaveDialog(true)
  }

  const handleSaveSuccess = (quizId: string) => {
    setSavedQuizId(quizId)
  }

  const handleQuizComplete = (score: number, answers: Record<number, string>) => {
    setCurrentScore(score)
    setCurrentAnswers(answers)
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="text-center space-y-8 min-h-[500px] flex flex-col justify-center">
          <div>
            <h1 className="text-4xl font-semibold mb-4 tracking-tight">Welcome to Quiz Forum</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Please sign in to access the quiz functionality and track your progress.
            </p>
          </div>
          <Button onClick={() => router.push("/login")} size="lg" className="rounded-lg text-base px-8 py-3">
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold mb-4 tracking-tight">Knowledge Test Forum</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Create and take interactive quizzes with seamless file upload and progress tracking.
        </p>
      </div>

      {!isLoaded ? (
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Quiz Questions</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Upload a JSON file containing quiz questions. The file should be formatted with questions, options, and
            correct answers.
          </p>
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <Button variant="outline" onClick={() => setIsLoaded(false)} className="rounded-lg">
              Load New Quiz
            </Button>
            <div className="flex gap-3">
              {!savedQuizId && (
                <Button onClick={handleSaveQuiz} className="rounded-lg">
                  Save Quiz
                </Button>
              )}
              {savedQuizId && (
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-lg">
                  View Dashboard
                </Button>
              )}
            </div>
          </div>
          <Quiz questions={questions} savedQuizId={savedQuizId} onQuizComplete={handleQuizComplete} />
          <QuizSaveDialog
            isOpen={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            questions={questions}
            onSaveSuccess={handleSaveSuccess}
            currentScore={currentScore}
            currentAnswers={currentAnswers}
          />
        </>
      )}
    </div>
  )
}
