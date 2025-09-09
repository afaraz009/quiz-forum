"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface QuizHistory {
  id: string
  title: string
  description: string | null
  totalQuestions: number
  createdAt: string
  updatedAt: string
  totalAttempts: number
  highestScore: number
  latestScore: number | null
  lastAttemptDate: string | null
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizHistory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchQuizHistory()
    }
  }, [session])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuizzes(quizHistory)
    } else {
      const filtered = quizHistory.filter(quiz =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredQuizzes(filtered)
    }
  }, [searchQuery, quizHistory])

  const fetchQuizHistory = async () => {
    try {
      const response = await fetch("/api/quiz/history")
      if (response.ok) {
        const data = await response.json()
        setQuizHistory(data.quizzes)
        setFilteredQuizzes(data.quizzes)
      }
    } catch (error) {
      console.error("Error fetching quiz history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetakeQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}`)
      if (response.ok) {
        const data = await response.json()
        // Navigate to quiz page with questions
        router.push(`/quiz/${quizId}`)
      }
    } catch (error) {
      console.error("Error loading quiz:", error)
    }
  }

  if (status === "loading" || isLoading) {
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
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            Please sign in to access your dashboard.
          </p>
          <Button onClick={() => router.push("/login")} size="lg">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name}! Here's your quiz activity overview.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz History</CardTitle>
              <CardDescription>
                Your saved quizzes and performance history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizHistory.length > 0 && (
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              {quizHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No saved quizzes yet.</p>
                  <p className="text-sm">Save your first quiz to see results here.</p>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No quizzes match your search.</p>
                  <p className="text-sm">Try a different search term.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuizzes.map((quiz) => (
                    <div key={quiz.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mb-2">{quiz.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">{quiz.totalQuestions} questions</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Highest Score</p>
                          <p className="font-medium">{quiz.highestScore}/{quiz.totalQuestions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Latest Score</p>
                          <p className="font-medium">
                            {quiz.latestScore !== null ? `${quiz.latestScore}/${quiz.totalQuestions}` : "No attempts"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Attempts</p>
                          <p className="font-medium">{quiz.totalAttempts}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Taken</p>
                          <p className="font-medium">
                            {quiz.lastAttemptDate 
                              ? formatDistanceToNow(new Date(quiz.lastAttemptDate), { addSuffix: true })
                              : "Never"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRetakeQuiz(quiz.id)}>
                          Take Quiz
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/quiz/${quiz.id}/history`)}>
                          View History
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with your quiz activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push("/")} 
                className="w-full"
              >
                Start New Quiz
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name: </span>
                <span>{session.user?.name}</span>
              </div>
              <div>
                <span className="font-medium">Email: </span>
                <span>{session.user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}