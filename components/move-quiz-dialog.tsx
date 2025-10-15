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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<{id: string, name: string} | null>(null)
  const [folders, setFolders] = useState<any[]>([])

  // Fetch folders for delete functionality
  useEffect(() => {
    if (isOpen) {
      const fetchFolders = async () => {
        try {
          const response = await fetch("/api/folders")
          if (response.ok) {
            const data = await response.json()
            setFolders(data.folders)
          }
        } catch (error) {
          console.error("Error fetching folders:", error)
        }
      }
      
      fetchFolders()
    }
  }, [isOpen])

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