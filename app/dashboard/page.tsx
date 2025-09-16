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
import { PublishedTestsTable } from "@/components/published-tests-table"
import { PracticeQuizzesTable } from "@/components/practice-quizzes-table"

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

interface PublishedTest {
  id: string
  title: string
  description: string | null
  timeLimit: number | null
  dueDate: string | null
  allowLateSubmissions: boolean
  createdBy: {
    name: string | null
    email: string
  }
  publishedAt: string
  totalQuestions: number
  hasAttempted: boolean
  attempt: {
    id: string
    score: number | null
    isCompleted: boolean
    completedAt: string | null
    createdAt: string
  } | null
  canTakeTest: boolean
  isOverdue: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizHistory[]>([])
  const [publishedTests, setPublishedTests] = useState<PublishedTest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchQuizHistory()
      fetchPublishedTests()
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

  const fetchPublishedTests = async () => {
    try {
      const response = await fetch("/api/published-tests")
      if (response.ok) {
        const data = await response.json()
        setPublishedTests(data.publishedTests)
      }
    } catch (error) {
      console.error("Error fetching published tests:", error)
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

  const handleTakePublishedTest = (testId: string) => {
    router.push(`/published-test/${testId}`)
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
        <div className="text-center space-y-8 min-h-[500px] flex flex-col justify-center animate-slide-up">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto">
              🔒
            </div>
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Please sign in to access your personalized dashboard and track your quiz progress.
            </p>
          </div>
          <Button onClick={() => router.push("/login")} size="lg" className="rounded-xl">
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 py-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
            🏆 Your Learning Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Welcome back, <span className="font-semibold text-foreground">{session.user?.name}</span>! Here's your quiz activity overview and achievements.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Quick Actions Card */}
          <Card className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  ⚡
                </div>
                <div>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                  <CardDescription className="text-base">
                    Get started with your quiz activities
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push("/")} 
                size="lg"
                className="w-full rounded-xl text-base font-semibold py-4 group"
              >
                Start New Quiz
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">🚀</span>
              </Button>
            </CardContent>
          </Card>

          {/* Published Tests Section */}
          {publishedTests.length > 0 && (
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      📝
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        Published Tests
                      </CardTitle>
                      <CardDescription className="text-base">
                        Instructor-created tests for assessment (single attempt only)
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 px-3 py-1">
                    Assessment Mode
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PublishedTestsTable tests={publishedTests} />
              </CardContent>
            </Card>
          )}

          {/* Practice Quizzes Section */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    🎯
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      Practice Quizzes
                    </CardTitle>
                    <CardDescription className="text-base">
                      Your personal quizzes and performance history (unlimited attempts)
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-3 py-1">
                  Practice Mode
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {quizHistory.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search your quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-border/50 focus:border-primary/50"
                  />
                </div>
              )}
              {quizHistory.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto">
                    📋
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">No saved quizzes yet</p>
                    <p className="text-muted-foreground">Save your first quiz to see results and analytics here.</p>
                  </div>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto">
                    🔍
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">No quizzes match your search</p>
                    <p className="text-muted-foreground">Try a different search term or browse all quizzes.</p>
                  </div>
                </div>
              ) : (
                <PracticeQuizzesTable quizzes={filteredQuizzes} />
              )}
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  👤
                </div>
                <div>
                  <CardTitle className="text-xl">Account Information</CardTitle>
                  <CardDescription className="text-base">
                    Your profile details and preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <span className="font-medium text-muted-foreground">Name</span>
                  <span className="font-semibold">{session.user?.name}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <span className="font-medium text-muted-foreground">Email</span>
                  <span className="font-semibold">{session.user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}