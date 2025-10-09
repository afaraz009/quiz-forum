"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { Quiz } from "@/components/quiz"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock, Calendar } from "lucide-react"
import { QuizQuestion } from "@/types/quiz"

interface PublishedTestData {
  id: string
  title: string
  description: string | null
  questions: QuizQuestion[]
  timeLimit: number | null
  createdBy: {
    name: string | null
    email: string
  }
  hasAttempted: boolean
  canTakeTest: boolean
}

export default function PublishedTestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [testData, setTestData] = useState<PublishedTestData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const hasSubmittedRef = useRef(false)
  const currentAnswersRef = useRef<Record<number, string>>({})
  const quizRef = useRef<HTMLDivElement>(null)

  const fetchTestData = useCallback(async () => {
    try {
      const response = await fetch(`/api/published-tests/${testId}`)
      if (response.ok) {
        const data = await response.json()
        setTestData(data.test)

        // Set initial time if test has time limit
        if (data.test.timeLimit) {
          setTimeRemaining(data.test.timeLimit * 60) // Convert minutes to seconds
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load test')
      }
    } catch (error) {
      console.error("Error fetching test data:", error)
      setError('Failed to load test')
    } finally {
      setIsLoading(false)
    }
  }, [testId])

  const handleSubmitQuiz = useCallback(async (answers: Record<number, string>) => {
    if (!testData || hasSubmittedRef.current) return

    // Update current answers ref
    currentAnswersRef.current = answers

    hasSubmittedRef.current = true
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/published-tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId: testData.id,
          answers: answers
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Navigate to results page
        router.push(`/published-test/${testId}/results`)
      } else {
        const errorData = await response.json()
        console.error('Error submitting test:', errorData.error)
        alert('Error submitting test: ' + errorData.error)
        hasSubmittedRef.current = false
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting test:', error)
      alert('Error submitting test. Please try again.')
      hasSubmittedRef.current = false
      setIsSubmitting(false)
    }
  }, [testData, testId, router])

  const handleStartTest = () => {
    setHasStarted(true)
  }

  const handleAnswerChange = useCallback((answers: Record<number, string>) => {
    console.log('Answer changed:', answers, 'Count:', Object.keys(answers).length)
    currentAnswersRef.current = answers
    setCurrentAnswers(answers) // Update reactive state for sticky header
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (session?.user && testId) {
      fetchTestData()
    }
  }, [session, testId, fetchTestData])

  // Scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (quizRef.current && hasStarted) {
        const rect = quizRef.current.getBoundingClientRect()
        // Show sticky header when quiz content starts to scroll out of view
        setShowStickyHeader(rect.top < -100)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasStarted])

  // Timer effect - only start when test begins
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (hasStarted && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Time's up - auto submit if not already submitted
            if (!hasSubmittedRef.current) {
              setTimeout(() => handleSubmitQuiz(currentAnswersRef.current), 0)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [hasStarted]) // Only depend on hasStarted, not timeRemaining

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading test...</div>
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
            Please sign in to access this test.
          </p>
          <Button onClick={() => router.push("/login")} size="lg">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold">Error Loading Test</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/dashboard")} size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!testData) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <h1 className="text-3xl font-bold">Test Not Found</h1>
          <Button onClick={() => router.push("/dashboard")} size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Show restriction message if already attempted
  if (testData.hasAttempted) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <AlertCircle className="h-16 w-16 text-orange-500 mx-auto" />
          <h1 className="text-3xl font-bold">Test Already Completed</h1>
          <p className="text-muted-foreground">
            You have already attempted this test. Each test can only be taken once.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push(`/published-test/${testId}/results`)} size="lg">
              View Results
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")} size="lg">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSaveForPractice = async () => {
    if (!testData || isSaving) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/published-tests/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId: testData.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        setIsSaved(true)
        alert('Test saved for practice successfully!')
      } else {
        const errorData = await response.json()
        alert('Error saving test: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error saving test:', error)
      alert('Error saving test. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Pre-test screen
  if (!hasStarted) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="space-y-6">
          <Card className="border-2 border-orange-200 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 {testData.title}
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Assessment Mode
                </Badge>
              </CardTitle>
              <CardDescription>
                Created by {testData.createdBy.name || testData.createdBy.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testData.description && (
                <p className="text-muted-foreground">{testData.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{testData.questions.length} questions</Badge>
                </div>
                {testData.timeLimit && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{testData.timeLimit} minutes</span>
                  </div>
                )}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">⚠️ Important Instructions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  <li>This is an assessment test - you can only attempt it <strong>once</strong></li>
                  <li>Once you start, you cannot pause or stop the test</li>
                  {testData.timeLimit && (
                    <li>You have {testData.timeLimit} minutes to complete the test</li>
                  )}
                  <li>Make sure you have a stable internet connection</li>
                  <li>Your answers will be automatically saved as you progress</li>
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleStartTest}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Start Test
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  size="lg"
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveForPractice}
                  disabled={isSaving || isSaved}
                  size="lg"
                >
                  {isSaving ? "Saving..." : isSaved ? "Saved for Practice" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Test taking screen
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      {/* Sticky Progress and Timer Header */}
      {showStickyHeader && testData && (
        <div key={`sticky-${Object.keys(currentAnswers).length}`} className="fixed top-0 left-0 right-0 z-50 bg-orange-50/95 backdrop-blur-sm border-b border-orange-200 shadow-sm">
          <div className="container mx-auto p-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-orange-900">{testData.title}</h2>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                  Assessment Mode
                </Badge>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <span>{Object.keys(currentAnswers).length} / {testData.questions.length}</span>
                  <span className="text-xs">answered</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(Object.keys(currentAnswers).length / testData.questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {timeRemaining !== null && (
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${timeRemaining < 300 ? 'text-red-500' : 'text-orange-600'}`} />
                    <span className={`text-sm font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-orange-600'}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleSaveForPractice}
                    disabled={isSaving || isSaved}
                  >
                    {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => {
                      // Scroll to the submit button in the quiz component
                      const quizElement = quizRef.current;
                      if (quizElement) {
                        const submitSection = quizElement.querySelector('.border-t');
                        if (submitSection) {
                          submitSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                  >
                    Submit Test
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Test header with timer */}
        <Card className="border-2 border-orange-200 bg-orange-50/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold select-none">{testData.title}</h1>
                <p className="text-sm text-muted-foreground select-none">Assessment Mode - Single Attempt Only</p>
              </div>
              <div className="flex items-center gap-4">
                {timeRemaining !== null && (
                  <div className="flex items-center gap-2">
                    <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-500' : 'text-orange-600'}`} />
                    <span className={`text-lg font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-orange-600'}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleSaveForPractice}
                    disabled={isSaving || isSaved}
                  >
                    {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
                  </Button>
                  {!showStickyHeader && (
                    <Button 
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => {
                        // Scroll to the submit button in the quiz component
                        const quizElement = quizRef.current;
                        if (quizElement) {
                          const submitSection = quizElement.querySelector('.border-t');
                          if (submitSection) {
                            submitSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                    >
                      Submit Test
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz component */}
        <div ref={quizRef}>
          <Quiz
            questions={testData.questions}
            onSubmit={handleSubmitQuiz}
            onAnswerChange={handleAnswerChange}
            title={testData.title}
            readonly={false}
            isAssessmentMode={true}
            hideProgressBar={showStickyHeader}
          />
        </div>
      </div>
    </div>
  )
}