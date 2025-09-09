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
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <h1 className="text-3xl font-bold">Welcome to Quiz Forum</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Please sign in to access the quiz functionality and track your progress.
          </p>
          <Button onClick={() => router.push("/login")} size="lg">
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Knowledge Test Forum</h1>

      {!isLoaded ? (
        <div className="bg-card rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Quiz Questions</h2>
          <p className="mb-4 text-muted-foreground">
            Upload a JSON file containing quiz questions. The file should be formatted with questions, options, and
            correct answers.
          </p>
          <FileUploader onFileUpload={handleFileUpload} />

         
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <Button variant="outline" onClick={() => setIsLoaded(false)}>
              Load New Quiz
            </Button>
            {!savedQuizId && (
              <Button onClick={handleSaveQuiz}>
                Save Quiz
              </Button>
            )}
            {savedQuizId && (
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                View Dashboard
              </Button>
            )}
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
