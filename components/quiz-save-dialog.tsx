"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { QuizQuestion } from "@/types/quiz"
import { FolderSelector } from "@/components/folder-selector"

interface QuizSaveDialogProps {
  isOpen: boolean
  onClose: () => void
  questions: QuizQuestion[]
  onSaveSuccess: (quizId: string) => void
  currentScore?: number
  currentAnswers?: Record<number, string>
}

export function QuizSaveDialog({ isOpen, onClose, questions, onSaveSuccess, currentScore, currentAnswers }: QuizSaveDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [folderId, setFolderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/quiz/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          questions,
          folderId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const quizId = data.quiz.id
        
        // If there's a current score/answers, save the attempt too
        if (currentScore !== undefined && currentAnswers) {
          try {
            const attemptResponse = await fetch("/api/quiz/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                quizId,
                score: currentScore,
                totalQuestions: questions.length,
                answers: currentAnswers,
              }),
            })
            
            if (!attemptResponse.ok) {
              console.error("Failed to save quiz attempt")
            }
          } catch (error) {
            console.error("Error saving quiz attempt:", error)
          }
        }
        
        toast.success("Quiz saved successfully!")
        onSaveSuccess(quizId)
        setTitle("")
        setDescription("")
        setFolderId(null)
        onClose()
      } else {
        toast.error(data.error || "Failed to save quiz")
      }
    } catch (error) {
      toast.error("An error occurred while saving the quiz")
    } finally {
      setIsLoading(false)
    }
  }

  const handleValueChange = (value: string | null) => {
    // Handle create new folder option
    if (value === "create-new") {
      // The folder selector will handle opening the create dialog
      return
    }
    setFolderId(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Quiz</DialogTitle>
          <DialogDescription>
            Save this quiz to your library so you can retake it later and track your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              placeholder="Enter quiz title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the quiz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <FolderSelector 
            value={folderId} 
            onValueChange={handleValueChange} 
            showCreateOption={true}
          />
          <div className="text-sm text-muted-foreground">
            Questions: {questions.length}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}