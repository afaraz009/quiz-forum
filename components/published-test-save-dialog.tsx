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

interface PublishedTestSaveDialogProps {
  isOpen: boolean
  onClose: () => void
  testId: string
  testTitle: string
  onSaveSuccess: () => void
}

export function PublishedTestSaveDialog({ isOpen, onClose, testId, testTitle, onSaveSuccess }: PublishedTestSaveDialogProps) {
  const [folderId, setFolderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/published-tests/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId,
          folderId
        })
      })

      if (response.ok) {
        toast.success(`"${testTitle}" saved successfully!`)
        onSaveSuccess()
        setFolderId(null)
        onClose()
      } else {
        const errorData = await response.json()
        toast.error('Error saving test: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error saving test:', error)
      toast.error('Error saving test. Please try again.')
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
          <DialogTitle>Save Test for Practice</DialogTitle>
          <DialogDescription>
            Save this test to your library so you can practice it later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm">
            <span className="font-medium">Test:</span> {testTitle}
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
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
