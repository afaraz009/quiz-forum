"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Quiz } from "@/components/quiz"
import type { QuizQuestion } from "@/types/quiz"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface QuizData {
  id: string
  title: string
  description: string | null
  questions: QuizQuestion[]
  totalQuestions: number
  createdAt: string
  updatedAt: string
}

export default function QuizRetakePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}`)
      if (response.ok) {
        const data = await response.json()
        setQuizData(data.quiz)
      } else {
        setError("Quiz not found or access denied")
      }
    } catch (error) {
      setError("Error loading quiz")
    } finally {
      setIsLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    if (session?.user && quizId) {
      fetchQuiz()
    }
  }, [session, quizId, fetchQuiz])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading quiz...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            Please sign in to access this quiz.
          </p>
          <Button onClick={() => router.push("/login")} size="lg">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <h1 className="text-3xl font-bold">Quiz Not Found</h1>
          <p className="text-muted-foreground">
            {error || "The quiz you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Button onClick={() => router.push("/dashboard")} size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{quizData.title}</h1>
            {quizData.description && (
              <p className="text-muted-foreground mt-1">{quizData.description}</p>
            )}
          </div>
        </div>
      </div>

      <Quiz questions={quizData.questions} savedQuizId={quizData.id} />
    </div>
  )
}