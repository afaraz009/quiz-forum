"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { useState, useMemo } from "react"
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
import { ArrowUpDown, Trash2 } from "lucide-react"
import type { VocabularyQuizHistory, QuestionType } from "@/types/vocabulary"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface VocabularyQuizHistoryTableProps {
  quizzes: VocabularyQuizHistory[]
  onQuizzesChange?: () => void
}

type SortField = keyof VocabularyQuizHistory
type SortDirection = "asc" | "desc"

export function VocabularyQuizHistoryTable({
  quizzes,
  onQuizzesChange,
}: VocabularyQuizHistoryTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<VocabularyQuizHistory | null>(null)
  const { toast } = useToast()

  const handleRetakeQuiz = (quizId: string) => {
    router.push(`/vocabulary-quiz/${quizId}`)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIndicator = (field: SortField) => {
    if (field !== sortField) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  const getQuestionTypeBadge = (type: QuestionType) => {
    const config = {
      "word-to-meaning": {
        label: "Definition",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      },
      "word-to-urdu": {
        label: "Urdu",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      },
      "word-to-usage": {
        label: "Usage",
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      },
    }
    return config[type]
  }

  // Sort quizzes based on current sort settings
  const sortedQuizzes = useMemo(() => {
    return [...quizzes].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle date strings
      if (sortField === "createdAt" || sortField === "updatedAt" || sortField === "lastAttemptDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1
      }
      return 0
    })
  }, [quizzes, sortField, sortDirection])

  const handleDeleteClick = (quiz: VocabularyQuizHistory) => {
    setQuizToDelete(quiz)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return

    try {
      const response = await fetch(`/api/vocabulary-quiz/${quizToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Vocabulary quiz deleted successfully",
        })
        onQuizzesChange?.()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete quiz",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setQuizToDelete(null)
    }
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto">
          📚
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">No vocabulary quizzes yet</p>
          <p className="text-muted-foreground">
            Generate your first vocabulary quiz to start practicing
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
              <div className="flex items-center gap-1">
                Title {getSortIndicator("title")}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Question Types</TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("totalQuestions")}
            >
              <div className="flex items-center gap-1">
                Questions {getSortIndicator("totalQuestions")}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("totalAttempts")}
            >
              <div className="flex items-center gap-1">
                Attempts {getSortIndicator("totalAttempts")}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("highestScore")}
            >
              <div className="flex items-center gap-1">
                Best Score {getSortIndicator("highestScore")}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("lastAttemptDate")}
            >
              <div className="flex items-center gap-1">
                Last Attempt {getSortIndicator("lastAttemptDate")}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedQuizzes.map((quiz) => (
            <TableRow key={quiz.id}>
              <TableCell>
                <div className="font-medium">{quiz.title}</div>
                {quiz.description && (
                  <div className="text-sm text-muted-foreground">{quiz.description}</div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {quiz.questionTypes.map((type) => {
                    const badge = getQuestionTypeBadge(type)
                    return (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={`${badge.color} text-xs`}
                      >
                        {badge.label}
                      </Badge>
                    )
                  })}
                </div>
              </TableCell>
              <TableCell>{quiz.totalQuestions}</TableCell>
              <TableCell>{quiz.totalAttempts}</TableCell>
              <TableCell>
                {quiz.totalAttempts > 0
                  ? `${quiz.highestScore}/${quiz.totalQuestions}`
                  : "Not attempted"}
              </TableCell>
              <TableCell>
                {quiz.lastAttemptDate
                  ? formatDistanceToNow(new Date(quiz.lastAttemptDate), {
                      addSuffix: true,
                    })
                  : "Never"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRetakeQuiz(quiz.id)}>
                    {quiz.totalAttempts > 0 ? "Retake" : "Take Quiz"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteClick(quiz)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vocabulary quiz &quot;{quizToDelete?.title}&quot; and all
              its attempt history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
