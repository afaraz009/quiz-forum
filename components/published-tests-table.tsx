"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PublishedTest {
  id: string
  title: string
  description: string | null
  timeLimit: number | null
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
}

interface PublishedTestsTableProps {
  tests: PublishedTest[]
}

export function PublishedTestsTable({ tests }: PublishedTestsTableProps) {
  const router = useRouter()

  const handleTakePublishedTest = (testId: string) => {
    router.push(`/published-test/${testId}`)
  }

  const calculatePercentage = (score: number, totalQuestions: number) => {
    return Math.round((score / totalQuestions) * 100)
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    if (percentage >= 70) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
  }

  const getPassFailStatus = (percentage: number) => {
    const passed = percentage >= 70
    return {
      text: passed ? "Passed" : "Failed",
      className: passed 
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Marks/Questions</TableHead>
          <TableHead>Time Limit</TableHead>
          <TableHead>Published</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tests.map((test) => (
          <TableRow key={test.id}>
            <TableCell>
              <div className="font-medium">{test.title}</div>
              <div className="text-sm text-muted-foreground">{test.description}</div>
            </TableCell>
            <TableCell>
              {test.hasAttempted && test.attempt?.score !== null && test.attempt?.score !== undefined ? (
                <div className="font-medium">
                  {test.attempt.score}/{test.totalQuestions}
                </div>
              ) : (
                <div className="text-muted-foreground">-/{test.totalQuestions}</div>
              )}
            </TableCell>
            <TableCell>{test.timeLimit ? `${test.timeLimit} minutes` : "N/A"}</TableCell>
            <TableCell>
              <div className="text-sm">
                {formatDistanceToNow(new Date(test.publishedAt), { addSuffix: true })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(test.publishedAt).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell>
              {test.hasAttempted && test.attempt?.score !== null && test.attempt?.score !== undefined ? (
                (() => {
                  const percentage = calculatePercentage(test.attempt.score, test.totalQuestions)
                  return (
                    <Badge className={getScoreColor(percentage)}>
                      {percentage}%
                    </Badge>
                  )
                })()
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
            <TableCell>
              {test.hasAttempted && test.attempt?.score !== null && test.attempt?.score !== undefined ? (
                (() => {
                  const percentage = calculatePercentage(test.attempt.score, test.totalQuestions)
                  return (
                    <Badge className={getPassFailStatus(percentage).className}>
                      {getPassFailStatus(percentage).text}
                    </Badge>
                  )
                })()
              ) : (
                <Badge variant="outline">Not Attempted</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {test.canTakeTest ? (
                  <Button
                    size="sm"
                    onClick={() => handleTakePublishedTest(test.id)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Take Test
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Already Attempted
                  </Button>
                )}
                {test.hasAttempted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/published-test/${test.id}/results`)}
                  >
                    View Results
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
