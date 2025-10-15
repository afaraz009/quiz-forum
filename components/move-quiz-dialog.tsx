"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { FolderSelector } from "@/components/folder-selector"

interface MoveQuizDialogProps {
  isOpen: boolean
  onClose: () => void
  quizId: string
  quizTitle: string
  currentFolderId: string | null
  onMoveSuccess: () => void
}

export function MoveQuizDialog({ isOpen, onClose, quizId, quizTitle, currentFolderId, onMoveSuccess }: MoveQuizDialogProps) {
  const [folderId, setFolderId] = useState<string | null>(currentFolderId)
  const [isLoading, setIsLoading] = useState(false)

  const handleMove = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/folders/move-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quizId,
          folderId
        })
      })

      if (response.ok) {
        toast.success(`"${quizTitle}" moved successfully!`)
        onMoveSuccess()
        setFolderId(null)
        onClose()
      } else {
        const errorData = await response.json()
        toast.error('Error moving quiz: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error moving quiz:', error)
      toast.error('Error moving quiz. Please try again.')
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
          <DialogTitle>Move Quiz</DialogTitle>
          <DialogDescription>
            Move this quiz to a different folder.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm">
            <span className="font-medium">Quiz:</span> {quizTitle}
          </div>
          <FolderSelector 
            value={folderId} 
            onValueChange={handleValueChange} 
            showCreateOption={true}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isLoading}>
            {isLoading ? "Moving..." : "Move Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
