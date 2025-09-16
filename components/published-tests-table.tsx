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

interface PublishedTestsTableProps {
  tests: PublishedTest[]
}

export function PublishedTestsTable({ tests }: PublishedTestsTableProps) {
  const router = useRouter()

  const handleTakePublishedTest = (testId: string) => {
    router.push(`/published-test/${testId}`)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Time Limit</TableHead>
          <TableHead>Due Date</TableHead>
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
            <TableCell>{test.totalQuestions}</TableCell>
            <TableCell>{test.timeLimit ? `${test.timeLimit} minutes` : "N/A"}</TableCell>
            <TableCell>{test.dueDate ? new Date(test.dueDate).toLocaleDateString() : "N/A"}</TableCell>
            <TableCell>
              {test.hasAttempted ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  ✓ Completed
                </Badge>
              ) : test.isOverdue ? (
                <Badge variant="destructive">Overdue</Badge>
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
                    disabled={test.isOverdue && !test.allowLateSubmissions}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {test.isOverdue ? "Take Test (Late)" : "Take Test"}
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
