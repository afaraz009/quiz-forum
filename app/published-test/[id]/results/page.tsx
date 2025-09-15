"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, User, BarChart3 } from "lucide-react"
import { QuizQuestion } from "@/types/quiz"

interface TestResultData {
  id: string
  title: string
  description: string | null
  questions: QuizQuestion[]
  passingPercentage: number
  attempt: {
    id: string
    score: number
    totalQuestions: number
    answers: Record<number, string>
    completedAt: string
    startedAt: string
  }
  passed: boolean
  percentage: number
}

export default function TestResultsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [resultData, setResultData] = useState<TestResultData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user && testId) {
      fetchResultData()
    }
  }, [session, testId])

  const fetchResultData = async () => {
    try {
      const response = await fetch(`/api/published-tests/${testId}/results`)
      if (response.ok) {
        const data = await response.json()
        setResultData(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load results')
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      setError('Failed to load results')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading results...</div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    router.push('/login')
    return null
  }

  if (error || !resultData) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Results</h2>
            <p className="text-muted-foreground mb-4">{error || 'Results not found'}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { attempt, questions, passed, percentage } = resultData

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {passed ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            Test Results
          </h1>
          <p className="text-muted-foreground mt-2">{resultData.title}</p>
        </div>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Final Score</p>
            <p className="text-2xl font-bold">{attempt.score}/{attempt.totalQuestions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <User className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Percentage</p>
            <p className="text-2xl font-bold">{percentage}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            {passed ? (
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            )}
            <p className="text-sm text-muted-foreground">Result</p>
            <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Required</p>
            <p className="text-2xl font-bold">{resultData.passingPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Pass/Fail Banner */}
      <Card className={`mb-6 border-2 ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {passed ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <h2 className={`text-xl font-bold ${passed ? 'text-green-800' : 'text-red-800'}`}>
              {passed ? 'Congratulations! You passed the test.' : 'You did not pass this time.'}
            </h2>
          </div>
          <p className={`${passed ? 'text-green-700' : 'text-red-700'}`}>
            {passed
              ? `You scored ${percentage}% which exceeds the required ${resultData.passingPercentage}% to pass.`
              : `You scored ${percentage}% but needed ${resultData.passingPercentage}% to pass.`
            }
          </p>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>Review your answers and see the correct solutions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = attempt.answers[index] || ''
            const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
            const isUnanswered = !userAnswer.trim()

            return (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                isCorrect ? 'border-green-200 bg-green-50' :
                isUnanswered ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : isUnanswered ? (
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-gray-900">Question {index + 1}</h3>
                    <p className="text-gray-800 mb-3">{question.question}</p>

                    {/* Multiple choice options */}
                    {question.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        {question.options.map((option, optionIndex) => {
                          const isUserChoice = userAnswer === option
                          const isCorrectAnswer = option === question.correctAnswer

                          return (
                            <div key={optionIndex} className={`p-2 rounded border ${
                              isCorrectAnswer ? 'bg-green-100 border-green-300' :
                              isUserChoice && !isCorrectAnswer ? 'bg-red-100 border-red-300' :
                              'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {isUserChoice && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600" />}
                                <span className={`${isCorrectAnswer ? 'font-medium text-green-800' : 'text-gray-800'}`}>{option}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Answer summary */}
                    <div className="space-y-1 text-sm">
                      <div className="flex gap-2">
                        <span className="font-medium text-gray-900">Your answer:</span>
                        <span className={
                          isUnanswered ? 'text-yellow-700 italic' :
                          isCorrect ? 'text-green-700' : 'text-red-700'
                        }>
                          {isUnanswered ? 'No answer provided' : userAnswer}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-900">Correct answer:</span>
                          <span className="text-green-700">{question.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <Button onClick={() => router.push('/dashboard')} size="lg">
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}