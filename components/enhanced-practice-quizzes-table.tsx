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
import { useState, useMemo } from "react"
import { ArrowUpDown } from "lucide-react"

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

interface EnhancedPracticeQuizzesTableProps {
  quizzes: QuizHistory[]
}

type SortField = keyof QuizHistory | 'folderName'
type SortDirection = 'asc' | 'desc'

export function EnhancedPracticeQuizzesTable({ quizzes }: EnhancedPracticeQuizzesTableProps) {
  const router = useRouter()
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [selectedQuizTitle, setSelectedQuizTitle] = useState<string>("")
  const [selectedQuizFolderId, setSelectedQuizFolderId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Function to clean up the description display
  const cleanDescription = (description: string | null) => {
    if (!description) return null
    
    // Remove the "Saved from published test" part from the description
    return description.replace(/\s*\(Saved from published test.*\)/, '').trim() || null
  }

  // Sort quizzes based on current sort settings
  const sortedQuizzes = useMemo(() => {
    return [...quizzes].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'folderName':
          aValue = a.folder?.name || 'Uncategorized'
          bValue = b.folder?.name || 'Uncategorized'
          break
        case 'latestScore':
          aValue = a.latestScore !== null ? a.latestScore : -1
          bValue = b.latestScore !== null ? b.latestScore : -1
          break
        case 'lastAttemptDate':
          aValue = a.lastAttemptDate ? new Date(a.lastAttemptDate).getTime() : 0
          bValue = b.lastAttemptDate ? new Date(b.lastAttemptDate).getTime() : 0
          break
        default:
          aValue = a[sortField]
          bValue = b[sortField]
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [quizzes, sortField, sortDirection])

  // Get sort indicator for a column
  const getSortIndicator = (field: SortField) => {
    if (field !== sortField) return null
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
              <div className="flex items-center gap-1">
                Title {getSortIndicator('title')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('totalQuestions')}>
              <div className="flex items-center gap-1">
                Questions {getSortIndicator('totalQuestions')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('highestScore')}>
              <div className="flex items-center gap-1">
                Highest Score {getSortIndicator('highestScore')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('latestScore')}>
              <div className="flex items-center gap-1">
                Latest Score {getSortIndicator('latestScore')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('totalAttempts')}>
              <div className="flex items-center gap-1">
                Attempts {getSortIndicator('totalAttempts')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('lastAttemptDate')}>
              <div className="flex items-center gap-1">
                Last Taken {getSortIndicator('lastAttemptDate')}
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('folderName')}>
              <div className="flex items-center gap-1">
                Folder {getSortIndicator('folderName')}
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