"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { FolderPlus, Pen, Trash2 } from "lucide-react"

interface Folder {
  id: string
  name: string
  isDefault: boolean
}

interface FolderManagerProps {
  folders: Folder[]
  onFoldersChange: (folders: Folder[]) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FolderManager({ folders, onFoldersChange, isOpen, onOpenChange }: FolderManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  
  // Use controlled or uncontrolled dialog based on props
  const dialogOpen = isOpen !== undefined ? isOpen : isCreateDialogOpen
  const setDialogOpen = onOpenChange || setIsCreateDialogOpen

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
        setDialogOpen(false)
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

  const handleEditFolder = async (folderId: string, currentName: string) => {
    const newName = prompt("Enter new folder name:", currentName)
    if (!newName || newName.trim() === "" || newName === currentName) return

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Folder renamed to "${newName}" successfully!`)
        onFoldersChange(folders.map(folder => 
          folder.id === folderId ? { ...folder, name: newName.trim() } : folder
        ))
      } else {
        toast.error(data.error || "Failed to rename folder")
      }
    } catch (error) {
      toast.error("An error occurred while renaming the folder")
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Folders</DialogTitle>
          <DialogDescription>
            Create new folders or manage existing ones.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="folder-name" className="text-sm font-medium">
              Create New Folder
            </label>
            <div className="flex gap-2">
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
              <Button onClick={handleCreateFolder} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
          
          {folders.filter(f => !f.isDefault).length > 0 && (
            <div className="grid gap-2 pt-4 border-t">
              <label className="text-sm font-medium">
                Existing Folders
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {folders.filter(f => !f.isDefault).map(folder => (
                  <div key={folder.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm">{folder.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                        onClick={() => handleEditFolder(folder.id, folder.name)}
                      >
                        <Pen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the folder "${folder.name}"? All quizzes in this folder will be moved to Uncategorized.`)) {
                            handleDeleteFolder(folder.id, folder.name)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isCreating}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}