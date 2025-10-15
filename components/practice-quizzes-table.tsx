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
import { MoveQuizDialog } from "@/components/move-quiz-dialog"
import { useState } from "react"

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
  folderId: string | null
  folder: {
    id: string
    name: string
    isDefault: boolean
  } | null
}

interface PracticeQuizzesTableProps {
  quizzes: QuizHistory[]
}

export function PracticeQuizzesTable({ quizzes }: PracticeQuizzesTableProps) {
  const router = useRouter()
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [selectedQuizTitle, setSelectedQuizTitle] = useState<string>("")
  const [selectedQuizFolderId, setSelectedQuizFolderId] = useState<string | null>(null)

  const handleRetakeQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`)
  }

  const handleMoveQuizClick = (quizId: string, quizTitle: string, folderId: string | null) => {
    setSelectedQuizId(quizId)
    setSelectedQuizTitle(quizTitle)
    setSelectedQuizFolderId(folderId)
    setMoveDialogOpen(true)
  }

  const handleMoveSuccess = () => {
    // Refresh the page to update the folder information
    window.location.reload()
  }

  // Function to clean up the description display
  const cleanDescription = (description: string | null) => {
    if (!description) return null
    
    // Remove the "Saved from published test" part from the description
    return description.replace(/\s*\(Saved from published test.*\)/, '').trim() || null
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Questions</TableHead>
            <TableHead>Highest Score</TableHead>
            <TableHead>Latest Score</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Last Taken</TableHead>
            <TableHead>Folder</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quizzes.map((quiz) => (
            <TableRow key={quiz.id}>
              <TableCell>
                <div className="font-medium">{quiz.title}</div>
                <div className="text-sm text-muted-foreground">{cleanDescription(quiz.description)}</div>
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
                {quiz.folder ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {quiz.folder.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Uncategorized
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRetakeQuiz(quiz.id)}>
                    Take Quiz
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleMoveQuizClick(quiz.id, quiz.title, quiz.folderId)}
                  >
                    Move
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoveQuizDialog
        isOpen={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        quizId={selectedQuizId || ""}
        quizTitle={selectedQuizTitle}
        currentFolderId={selectedQuizFolderId}
        onMoveSuccess={handleMoveSuccess}
      />
    </>
  )
}