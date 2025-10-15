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
import { AlertTriangle } from "lucide-react"
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<{id: string, name: string} | null>(null)
  const [folders, setFolders] = useState<any[]>([])

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

  const handleFolderDelete = async (folderId: string, folderName: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Folder "${folderName}" deleted successfully!`)
        // Refresh folders list
        const response2 = await fetch("/api/folders")
        if (response2.ok) {
          const data2 = await response2.json()
          setFolders(data2.folders)
        }
        // If the deleted folder was selected, reset to uncategorized
        if (folderId === folderToDelete?.id) {
          setFolderId(null)
        }
      } else {
        toast.error(data.error || "Failed to delete folder")
      }
    } catch (error) {
      toast.error("An error occurred while deleting the folder")
    } finally {
      setShowDeleteConfirm(false)
      setFolderToDelete(null)
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
    <>
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
            
            {/* Folder delete options */}
            <div className="border-t pt-2">
              <div className="text-sm font-medium mb-2">Delete Folder</div>
              <div className="text-xs text-muted-foreground mb-3">
                Delete folders you no longer need. Quizzes will be moved to Uncategorized.
              </div>
              <div className="max-h-32 overflow-y-auto">
                {folders.filter(f => !f.isDefault).map(folder => (
                  <div key={folder.id} className="flex items-center justify-between py-1">
                    <span className="text-sm">{folder.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setFolderToDelete({id: folder.id, name: folder.name})
                        setShowDeleteConfirm(true)
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the folder "{folderToDelete?.name}". All quizzes in this folder will be moved to "Uncategorized".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => folderToDelete && handleFolderDelete(folderToDelete.id, folderToDelete.name)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}