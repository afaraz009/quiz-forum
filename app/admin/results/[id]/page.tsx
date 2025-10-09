"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Search, Users, BarChart3, Eye, CheckCircle, XCircle, Calendar, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { QuizQuestion } from "@/types/quiz"
import { FormattedCodeBlock } from "@/components/formatted-code-block"

// Function to process text with code formatting
const processTextWithCode = (text: string) => {
  // Split text by code blocks and inline code
  const parts = text.split(/(```\w*\n[\s\S]*?\n```|`[^`]*`)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // Code block
      return <FormattedCodeBlock key={index} code={part} />;
    } else if (part.startsWith('`') && part.endsWith('`')) {
      // Inline code
      return <FormattedCodeBlock key={index} code={part} />;
    } else if (part) {
      // Regular text
      return part;
    }
    return null;
  });
};

interface TestDetails {
  id: string
  title: string
  description: string | null
  questions: QuizQuestion[]
  publishedAt: string
  totalQuestions: number
  timeLimit: number | null
  dueDate: string | null
}

interface StudentAttempt {
  id: string
  user: {
    id: string
    name: string | null
    email: string
  }
  score: number
  answers: Record<string, string>
  startedAt: string
  completedAt: string
  percentage: number
  timeTaken: number // in minutes
}

interface TestAnalyticsDetail {
  test: TestDetails
  attempts: StudentAttempt[]
  analytics: {
    totalAttempts: number
    averageScore: number
    averagePercentage: number
    averageTimeTaken: number
    questionAnalytics: {
      questionIndex: number
      question: string
      correctAnswer: string
      correctCount: number
      incorrectCount: number
      accuracyRate: number
      commonWrongAnswers: { answer: string, count: number }[]
    }[]
  }
}

export default function TestResultsDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [testDetails, setTestDetails] = useState<TestAnalyticsDetail | null>(null)
  const [filteredAttempts, setFilteredAttempts] = useState<StudentAttempt[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("completedAt")
  const [selectedStudent, setSelectedStudent] = useState<StudentAttempt | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTestDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics/tests/${testId}`)
      if (response.ok) {
        const data = await response.json()
        setTestDetails(data)
      } else {
        console.error("Failed to fetch test details")
      }
    } catch (error) {
      console.error("Error fetching test details:", error)
    } finally {
      setIsLoading(false)
    }
  }, [testId])

  useEffect(() => {
    if (session?.user?.isAdmin && testId) {
      fetchTestDetails()
    }
  }, [session, testId, fetchTestDetails])

  useEffect(() => {
    if (testDetails) {
      let filtered = testDetails.attempts.filter(attempt =>
        attempt.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attempt.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Sort attempts
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.user.name || a.user.email).localeCompare(b.user.name || b.user.email)
          case "score":
            return b.score - a.score
          case "percentage":
            return b.percentage - a.percentage
          case "timeTaken":
            return b.timeTaken - a.timeTaken
          default: // completedAt
            return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        }
      })

      setFilteredAttempts(filtered)
    }
  }, [searchQuery, sortBy, testDetails])

  if (status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard")
  }

  const handleExportCSV = async () => {
    if (!testDetails) return

    try {
      const response = await fetch(`/api/admin/export/${testId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${testDetails.test.title.replace(/\s+/g, '_')}_detailed_results.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  const viewStudentAnswers = (student: StudentAttempt) => {
    setSelectedStudent(student)
    setShowAnswers(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading test details...</div>
        </div>
      </div>
    )
  }

  if (!testDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <h1 className="text-3xl font-bold">Test Not Found</h1>
          <Button onClick={() => router.push("/admin/results")}>
            Back to Results Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const { test, attempts, analytics } = testDetails

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/results")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{test.title}</h1>
            <p className="text-muted-foreground">
              Detailed results and analytics • Published {formatDistanceToNow(new Date(test.publishedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button onClick={handleExportCSV} className="gap-1">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Test Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold">{analytics.totalAttempts}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{analytics.averagePercentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.averageScore.toFixed(1)}/{test.totalQuestions} points
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold">{test.totalQuestions}</p>
                {test.timeLimit && (
                  <p className="text-xs text-muted-foreground">
                    {test.timeLimit} min limit
                  </p>
                )}
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">{analytics.averageTimeTaken.toFixed(0)}m</p>
                <p className="text-xs text-muted-foreground">
                  completion time
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Analytics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Question Performance Analysis</CardTitle>
          <CardDescription>
            Breakdown of student performance on each question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.questionAnalytics.map((qa, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">Question {qa.questionIndex + 1}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{qa.question}</p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Correct Answer: {qa.correctAnswer}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={qa.accuracyRate >= 80 ? "default" : qa.accuracyRate >= 60 ? "secondary" : "destructive"}>
                      {qa.accuracyRate.toFixed(1)}% accuracy
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {qa.correctCount}/{analytics.totalAttempts} correct
                    </p>
                  </div>
                </div>

                {qa.commonWrongAnswers.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Common Wrong Answers:</h5>
                    <div className="flex flex-wrap gap-2">
                      {qa.commonWrongAnswers.map((wrong, idx) => (
                        <Badge key={idx} variant="outline" className="text-red-600">
                          &ldquo;{wrong.answer}&rdquo; ({wrong.count} students)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                Individual student performance and answers
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completedAt">Most Recent</SelectItem>
                  <SelectItem value="name">Student Name</SelectItem>
                  <SelectItem value="score">Score (High to Low)</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="timeTaken">Time Taken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttempts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                {attempts.length === 0 ? "No students have attempted this test yet." : "No students match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttempts.map((attempt) => (
                <div key={attempt.id} className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{attempt.user.name || 'Unknown'}</h4>
                        <Badge variant={attempt.percentage >= 80 ? "default" : attempt.percentage >= 60 ? "secondary" : "destructive"}>
                          {attempt.score}/{test.totalQuestions} ({attempt.percentage.toFixed(0)}%)
                        </Badge>
                        {test.timeLimit && (
                          <Badge variant="outline" className="text-xs">
                            {attempt.timeTaken}m / {test.timeLimit}m
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{attempt.user.email}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {attempt.timeTaken} minutes
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewStudentAnswers(attempt)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Answers
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Answers Modal/Overlay */}
      {showAnswers && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {selectedStudent.user.name || 'Unknown'} - Answer Review
                  </CardTitle>
                  <CardDescription>
                    Score: {selectedStudent.score}/{test.totalQuestions} ({selectedStudent.percentage.toFixed(0)}%)
                    • Completed {formatDistanceToNow(new Date(selectedStudent.completedAt), { addSuffix: true })}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowAnswers(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {test.questions.map((question, index) => {
                  const userAnswer = selectedStudent.answers[index.toString()] || 'No answer'
                  const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()

                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm mb-3">{processTextWithCode(question.question)}</p>

                      {question.options && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-2">Options:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {question.options.map((option, optIdx) => (
                              <div key={optIdx} className={`p-2 rounded ${
                                option === question.correctAnswer ? 'bg-green-100 text-green-700' :
                                option === userAnswer ? 'bg-red-100 text-red-700' :
                                'bg-gray-50'
                              }`}>
                                {option === question.correctAnswer && '✓ '}
                                {option === userAnswer && option !== question.correctAnswer && '✗ '}
                                {processTextWithCode(option)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Student Answer:</p>
                          <p className={`p-2 rounded ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {processTextWithCode(userAnswer)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Correct Answer:</p>
                          <p className="p-2 rounded bg-green-50 text-green-700">
                            {processTextWithCode(question.correctAnswer)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}