"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

interface Folder {
  id: string
  name: string
  isDefault: boolean
}

interface FolderManagerProps {
  folders: Folder[]
  onFoldersChange: (folders: Folder[]) => void
}

export function FolderManager({ folders, onFoldersChange }: FolderManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Folder created successfully!")
        onFoldersChange([...folders, data.folder])
        setNewFolderName("")
        setIsCreateDialogOpen(false)
      } else {
        toast.error(data.error || "Failed to create folder")
      }
    } catch (error) {
      toast.error("An error occurred while creating the folder")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Folder "${folderName}" deleted successfully!`)
        onFoldersChange(folders.filter(folder => folder.id !== folderId))
      } else {
        toast.error(data.error || "Failed to delete folder")
      }
    } catch (error) {
      toast.error("An error occurred while deleting the folder")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            + New Folder
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your quizzes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="folder-name" className="text-sm font-medium">
                Folder Name
              </label>
              <Input
                id="folder-name"
                placeholder="Enter folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}