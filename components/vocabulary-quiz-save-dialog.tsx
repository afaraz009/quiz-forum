"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { QuizQuestion } from "@/types/quiz"
import type { QuestionType } from "@/types/vocabulary"
import { Badge } from "@/components/ui/badge"

interface VocabularyQuizSaveDialogProps {
  isOpen: boolean
  onClose: () => void
  questions: QuizQuestion[]
  questionTypes: QuestionType[]
}

export function VocabularyQuizSaveDialog({
  isOpen,
  onClose,
  questions,
  questionTypes,
}: VocabularyQuizSaveDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const getQuestionTypeBadge = (type: QuestionType) => {
    const config = {
      "word-to-meaning": { label: "Definition", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
      "word-to-urdu": { label: "Urdu", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
      "word-to-usage": { label: "Usage", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    }
    return config[type]
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title for your quiz",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/vocabulary-quiz/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          questions,
          questionTypes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Vocabulary quiz saved successfully",
        })
        onClose()
        router.push(`/vocabulary-quiz/${data.quiz.id}`)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save quiz",
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
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle("")
    setDescription("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Save Vocabulary Quiz</DialogTitle>
          <DialogDescription>
            Give your quiz a title and description to save it to your library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="space-y-4 py-4">
            {/* Quiz Info */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Questions:</span>
                <span className="text-lg font-bold">{questions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Question Types:</span>
                <div className="flex gap-1 flex-wrap">
                  {questionTypes.map((type) => {
                    const badge = getQuestionTypeBadge(type)
                    return (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={badge.color}
                      >
                        {badge.label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Week 1 Vocabulary Quiz"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this quiz..."
                rows={3}
              />
            </div>

            {/* Preview Questions */}
            <div className="space-y-2">
              <Label>Preview (First 3 Questions)</Label>
              <div className="p-4 bg-muted/30 rounded-lg space-y-3 max-h-60 overflow-y-auto">
                {questions.slice(0, 3).map((q, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">
                      {index + 1}. {q.question}
                    </p>
                    {q.options && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {q.options.map((option, optIndex) => (
                          <li
                            key={optIndex}
                            className={
                              option === q.correctAnswer
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {questions.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    ... and {questions.length - 3} more question{questions.length - 3 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save & Take Quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
