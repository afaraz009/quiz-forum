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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, Download, Search, Users, TrendingUp, Eye, Calendar, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
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
  questions?: QuizQuestion[]
  scoreDistribution: {
    range: string
    count: number
    percentage: number
  }[]
  recentAttempts: {
    id?: string
    studentName: string
    studentEmail: string
    score: number
    completedAt: string
    percentage: number
    passed: boolean
    answers?: Record<string, string>
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
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{[testId: string]: {key: string, direction: 'asc' | 'desc'}}>({});
  const [selectedStudent, setSelectedStudent] = useState<{attempt: any, test: TestAnalytics} | null>(null)
  const [showAnswerReview, setShowAnswerReview] = useState(false)

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

  const toggleTestExpanded = (testId: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
      } else {
        newSet.add(testId)
      }
      return newSet
    })
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

  const handleSort = (testId: string, key: string) => {
    setSortConfig(prev => {
      const currentSort = prev[testId]
      const newDirection = currentSort?.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc'
      return {
        ...prev,
        [testId]: { key, direction: newDirection }
      }
    })
  }

  const getSortedAttempts = (attempts: any[], testId: string) => {
    const sortCfg = sortConfig[testId]
    if (!sortCfg) {
      // Default sort: alphabetically by student name
      return [...attempts].sort((a, b) => a.studentName.localeCompare(b.studentName))
    }

    return [...attempts].sort((a, b) => {
      let aVal, bVal
      
      switch (sortCfg.key) {
        case 'name':
          aVal = a.studentName
          bVal = b.studentName
          break
        case 'email':
          aVal = a.studentEmail
          bVal = b.studentEmail
          break
        case 'score':
          aVal = a.score
          bVal = b.score
          break
        case 'percentage':
          aVal = a.percentage
          bVal = b.percentage
          break
        case 'status':
          aVal = a.passed ? 'PASS' : 'FAIL'
          bVal = b.passed ? 'PASS' : 'FAIL'
          break
        default:
          return 0
      }

      if (typeof aVal === 'string') {
        const result = aVal.localeCompare(bVal)
        return sortCfg.direction === 'asc' ? result : -result
      } else {
        const result = aVal - bVal
        return sortCfg.direction === 'asc' ? result : -result
      }
    })
  }

  const getSortIcon = (testId: string, columnKey: string) => {
    const sortCfg = sortConfig[testId]
    if (!sortCfg || sortCfg.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortCfg.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const handleRowDoubleClick = async (attempt: any, test: TestAnalytics) => {
    // Fetch detailed test data with questions if not available
    if (!attempt.answers) {
      try {
        const response = await fetch(`/api/admin/analytics/tests/${test.id}`)
        if (response.ok) {
          const data = await response.json()
          // Find the specific attempt from the detailed data
          const detailedAttempt = data.attempts.find((a: any) => 
            a.user.email === attempt.studentEmail && 
            a.score === attempt.score &&
            Math.abs(new Date(a.completedAt).getTime() - new Date(attempt.completedAt).getTime()) < 60000
          )
          if (detailedAttempt) {
            setSelectedStudent({ 
              attempt: {
                ...detailedAttempt,
                studentName: attempt.studentName,
                studentEmail: attempt.studentEmail,
                passed: attempt.passed
              }, 
              test: { ...test, questions: data.test.questions }
            })
            setShowAnswerReview(true)
          }
        }
      } catch (error) {
        console.error('Error fetching detailed attempt data:', error)
      }
    } else {
      setSelectedStudent({ attempt, test })
      setShowAnswerReview(true)
    }
  }



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
            Admin dashboard for managing published test results
          </p>
        </div>
        <Button onClick={() => router.push("/admin")} variant="outline">
          Back to Admin
        </Button>
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

      {/* Published Tests */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold mb-2">Published Tests</h2>
        <p className="text-muted-foreground">
          Manage and view results for all published tests. Click 'View Details' to see detailed analytics for each test.
        </p>
      </div>
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
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleTestExpanded(test.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {test.title}
                      <Badge variant="secondary">{test.totalQuestions} questions</Badge>
                      {expandedTests.has(test.id) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
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
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
              {expandedTests.has(test.id) && (
                <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pass/Fail</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {test.passedAttempts}/{test.failedAttempts}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {test.passedAttempts} passed, {test.failedAttempts} failed
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

                {/* All Attempts */}
                {test.recentAttempts.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">All Attempts</h4>
                    {/* Scrollable attempts table container */}
                    <div className="max-h-80 overflow-y-auto border border-border rounded-lg">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="w-[50px]">Icon</TableHead>
                            <TableHead 
                              className="cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort(test.id, 'name')}
                            >
                              <div className="flex items-center gap-1">
                                Student Name
                                {getSortIcon(test.id, 'name')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort(test.id, 'email')}
                            >
                              <div className="flex items-center gap-1">
                                Email
                                {getSortIcon(test.id, 'email')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort(test.id, 'score')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Score
                                {getSortIcon(test.id, 'score')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort(test.id, 'percentage')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Percentage
                                {getSortIcon(test.id, 'percentage')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-center cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => handleSort(test.id, 'status')}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Status
                                {getSortIcon(test.id, 'status')}
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedAttempts(test.recentAttempts, test.id)
                            .map((attempt, index) => (
                            <TableRow 
                              key={index} 
                              className={`cursor-pointer select-none ${
                                attempt.passed
                                  ? 'bg-green-50/50 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30'
                                  : 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                              }`}
                              onDoubleClick={() => handleRowDoubleClick(attempt, test)}
                            >
                              <TableCell>
                                {attempt.passed ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {attempt.studentName}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {attempt.studentEmail}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {attempt.score}/{test.totalQuestions}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${
                                attempt.passed
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-red-700 dark:text-red-300'
                              }`}>
                                {attempt.percentage.toFixed(0)}%
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={attempt.passed ? "default" : "destructive"}
                                  className={attempt.passed ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  {attempt.passed ? 'PASS' : 'FAIL'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* View detailed analysis button */}
                    <div className="text-center mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(test.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Detailed Analysis
                      </Button>
                    </div>
                  </div>
                )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Answer Review Modal */}
      {showAnswerReview && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {selectedStudent.attempt.studentName || 'Unknown'} - Answer Review
                  </CardTitle>
                  <CardDescription>
                    Score: {selectedStudent.attempt.score}/{selectedStudent.test.totalQuestions} ({selectedStudent.attempt.percentage.toFixed(0)}%)
                    • Completed {formatDistanceToNow(new Date(selectedStudent.attempt.completedAt), { addSuffix: true })}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowAnswerReview(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {selectedStudent.test.questions?.map((question, index) => {
                  const userAnswer = selectedStudent.attempt.answers?.[index.toString()] || 'No answer'
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
                                option === question.correctAnswer ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                option === userAnswer ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
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
                          <p className="font-medium text-gray-600 dark:text-gray-400">Student Answer:</p>
                          <p className={`p-2 rounded ${
                            isCorrect 
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {processTextWithCode(userAnswer)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600 dark:text-gray-400">Correct Answer:</p>
                          <p className="p-2 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
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