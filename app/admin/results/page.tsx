"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Download, Search, Users, TrendingUp, Eye, Calendar, Trash2, CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface TestAnalytics {
  id: string
  title: string
  description: string | null
  publishedAt: string
  totalQuestions: number
  totalStudents: number
  completedAttempts: number
  averageScore: number
  highestScore: number
  lowestScore: number
  completionRate: number
  passingPercentage: number
  passedAttempts: number
  failedAttempts: number
  passRate: number
  scoreDistribution: {
    range: string
    count: number
    percentage: number
  }[]
  recentAttempts: {
    studentName: string
    studentEmail: string
    score: number
    completedAt: string
    percentage: number
    passed: boolean
  }[]
}

export default function AdminResultsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [testsAnalytics, setTestsAnalytics] = useState<TestAnalytics[]>([])
  const [filteredTests, setFilteredTests] = useState<TestAnalytics[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("publishedAt")
  const [isLoading, setIsLoading] = useState(true)
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const fetchTestsAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/analytics/tests")
      if (response.ok) {
        const data = await response.json()
        setTestsAnalytics(data.testsAnalytics)
      } else {
        console.error("Failed to fetch test analytics")
      }
    } catch (error) {
      console.error("Error fetching test analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchTestsAnalytics()
    }
  }, [session, fetchTestsAnalytics])

  useEffect(() => {
    let filtered = testsAnalytics.filter(test =>
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Sort based on selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "completionRate":
          return b.completionRate - a.completionRate
        case "averageScore":
          return b.averageScore - a.averageScore
        case "totalStudents":
          return b.completedAttempts - a.completedAttempts
        default: // publishedAt
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      }
    })

    setFilteredTests(filtered)
  }, [searchQuery, sortBy, testsAnalytics])

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

  const handleViewDetails = (testId: string) => {
    router.push(`/admin/results/${testId}`)
  }

  const handleExportCSV = async (testId: string, testTitle: string) => {
    try {
      const response = await fetch(`/api/admin/export/${testId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${testTitle.replace(/\s+/g, '_')}_results.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        console.error("Failed to export data")
      }
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  const handleDeleteTest = async (testId: string) => {
    setDeletingTestId(testId)
    try {
      const response = await fetch(`/api/admin/published-tests?id=${testId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        // Remove the test from the current list
        setTestsAnalytics(prev => prev.filter(test => test.id !== testId))
        setShowDeleteConfirm(null)
        // Show success message (you could add a toast here)
        console.log(result.message)
      } else {
        const errorData = await response.json()
        console.error("Failed to delete test:", errorData.error)
      }
    } catch (error) {
      console.error("Error deleting test:", error)
    } finally {
      setDeletingTestId(null)
    }
  }

  const calculateOverallStats = () => {
    if (testsAnalytics.length === 0) return {
      totalTests: 0,
      totalAttempts: 0,
      averageCompletion: 0,
      averageScore: 0,
      totalPassed: 0,
      totalFailed: 0,
      overallPassRate: 0
    }

    const totalTests = testsAnalytics.length
    const totalAttempts = testsAnalytics.reduce((sum, test) => sum + test.completedAttempts, 0)
    const averageCompletion = testsAnalytics.reduce((sum, test) => sum + test.completionRate, 0) / totalTests
    const averageScore = testsAnalytics.reduce((sum, test) => sum + test.averageScore, 0) / totalTests
    const totalPassed = testsAnalytics.reduce((sum, test) => sum + test.passedAttempts, 0)
    const totalFailed = testsAnalytics.reduce((sum, test) => sum + test.failedAttempts, 0)
    const overallPassRate = totalAttempts > 0 ? (totalPassed / totalAttempts) * 100 : 0

    return {
      totalTests,
      totalAttempts,
      averageCompletion,
      averageScore,
      totalPassed,
      totalFailed,
      overallPassRate
    }
  }

  const overallStats = calculateOverallStats()

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-green-500" />
            Results Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive view of student performance across all published tests
          </p>
        </div>
        <Button onClick={() => router.push("/admin")} variant="outline">
          Back to Admin
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{overallStats.totalTests}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold">{overallStats.totalAttempts}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Score</p>
                <p className="text-2xl font-bold">{overallStats.averageScore.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students Passed</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.totalPassed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students Failed</p>
                <p className="text-2xl font-bold text-red-600">{overallStats.totalFailed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Pass Rate</p>
                <p className="text-2xl font-bold text-blue-600">{overallStats.overallPassRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publishedAt">Most Recent</SelectItem>
                <SelectItem value="title">Test Name</SelectItem>
                <SelectItem value="completionRate">Completion Rate</SelectItem>
                <SelectItem value="averageScore">Average Score</SelectItem>
                <SelectItem value="totalStudents">Total Attempts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tests Analytics */}
      <div className="space-y-6">
        {filteredTests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Test Results</h3>
              <p className="text-muted-foreground">
                {testsAnalytics.length === 0
                  ? "No published tests with student attempts yet."
                  : "No tests match your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTests.map((test) => (
            <Card key={test.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {test.title}
                      <Badge variant="secondary">{test.totalQuestions} questions</Badge>
                    </CardTitle>
                    {test.description && (
                      <CardDescription className="mt-2">{test.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Published {formatDistanceToNow(new Date(test.publishedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleViewDetails(test.id)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportCSV(test.id, test.title)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                    {showDeleteConfirm === test.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTest(test.id)}
                          disabled={deletingTestId === test.id}
                          className="gap-1"
                        >
                          {deletingTestId === test.id ? "Deleting..." : "Confirm"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(null)}
                          disabled={deletingTestId === test.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(test.id)}
                        className="gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {test.completionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {test.completedAttempts} of {test.totalStudents} students
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-lg font-semibold text-green-600">
                      {test.averageScore.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(test.averageScore * test.totalQuestions / 100).toFixed(1)}/{test.totalQuestions} points
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Highest Score</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {test.highestScore}/{test.totalQuestions}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((test.highestScore / test.totalQuestions) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Lowest Score</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {test.lowestScore}/{test.totalQuestions}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((test.lowestScore / test.totalQuestions) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                    <p className="text-lg font-semibold text-gray-600">
                      {test.completedAttempts}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      completed tests
                    </p>
                  </div>
                </div>

                {/* Score Distribution */}
                {test.scoreDistribution.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Score Distribution</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {test.scoreDistribution.map((dist, index) => (
                        <div key={index} className="text-center">
                          <div className="bg-blue-100 rounded-lg p-2">
                            <div className="text-lg font-bold text-blue-600">{dist.count}</div>
                            <div className="text-xs text-muted-foreground">{dist.range}</div>
                            <div className="text-xs text-blue-500">{dist.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Attempts */}
                {test.recentAttempts.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Recent Attempts</h4>
                    <div className="space-y-2">
                      {test.recentAttempts
                        .sort((a, b) => {
                          // Sort by pass/fail status first (passed first), then by percentage descending
                          if (a.passed !== b.passed) return b.passed ? 1 : -1
                          return b.percentage - a.percentage
                        })
                        .slice(0, 3)
                        .map((attempt, index) => (
                        <div key={index} className={`flex justify-between items-center py-3 px-4 rounded-lg border-2 ${
                          attempt.passed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {attempt.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <div>
                              <span className="font-medium text-gray-900">{attempt.studentName}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                ({attempt.studentEmail})
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`font-semibold ${attempt.passed ? 'text-green-700' : 'text-red-700'}`}>
                                {attempt.score}/{test.totalQuestions} ({attempt.percentage.toFixed(0)}%)
                              </div>
                              <div className={`text-xs ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.passed ? 'PASSED' : 'FAILED'}
                              </div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {test.recentAttempts.length > 3 && (
                        <div className="text-center py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(test.id)}
                            className="text-gray-700 hover:text-gray-900"
                          >
                            View all {test.completedAttempts} attempts
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}