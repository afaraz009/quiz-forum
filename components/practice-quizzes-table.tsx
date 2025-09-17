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

interface PracticeQuizzesTableProps {
  quizzes: QuizHistory[]
}

export function PracticeQuizzesTable({ quizzes }: PracticeQuizzesTableProps) {
  const router = useRouter()

  const handleRetakeQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Highest Score</TableHead>
          <TableHead>Latest Score</TableHead>
          <TableHead>Attempts</TableHead>
          <TableHead>Last Taken</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quizzes.map((quiz) => (
          <TableRow key={quiz.id}>
            <TableCell>
              <div className="font-medium">{quiz.title}</div>
              <div className="text-sm text-muted-foreground">{quiz.description}</div>
            </TableCell>
            <TableCell>{quiz.totalQuestions}</TableCell>
            <TableCell>{`${quiz.highestScore}/${quiz.totalQuestions}`}</TableCell>
            <TableCell>
              {quiz.latestScore !== null ? `${quiz.latestScore}/${quiz.totalQuestions}` : "N/A"}
            </TableCell>
            <TableCell>{quiz.totalAttempts}</TableCell>
            <TableCell>
              {quiz.lastAttemptDate
                ? formatDistanceToNow(new Date(quiz.lastAttemptDate), { addSuffix: true })
                : "Never"}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleRetakeQuiz(quiz.id)}>
                  Take Quiz
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
