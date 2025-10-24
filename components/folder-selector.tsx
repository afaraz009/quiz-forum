"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FolderPlus, Pen, Trash2 } from "lucide-react"
import { FolderManager } from "@/components/folder-manager"
import { toast } from "sonner"

interface Folder {
  id: string
  name: string
  isDefault: boolean
}

interface FolderSelectorProps {
  value: string | null
  onValueChange: (value: string | null) => void
  showCreateOption?: boolean
}

export function FolderSelector({ value, onValueChange, showCreateOption = false }: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [isManagerOpen, setIsManagerOpen] = useState(false)

  useEffect(() => {
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
  }, [])

  // Filter out the default "Uncategorized" folder from the list since we're adding it manually
  const nonDefaultFolders = folders.filter(folder => !folder.isDefault)

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Folder "${folderName}" deleted successfully!`)
        setFolders(folders.filter(folder => folder.id !== folderId))
        
        // If the deleted folder was selected, reset to uncategorized
        if (value === folderId) {
          onValueChange(null)
        }
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
        setFolders(folders.map(folder => 
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
    <div className="grid gap-2">
      <Label htmlFor="folder">Folder (optional)</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={value || "uncategorized"} onValueChange={(val) => onValueChange(val === "uncategorized" ? null : val)}>
            <SelectTrigger id="folder">
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {nonDefaultFolders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id} className="flex items-center justify-between">
                  <div className="flex items-center justify-between w-full">
                    <span>{folder.name}</span>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditFolder(folder.id, folder.name)
                        }}
                      >
                        <Pen className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Are you sure you want to delete the folder "${folder.name}"? All quizzes in this folder will be moved to Uncategorized.`)) {
                            handleDeleteFolder(folder.id, folder.name)
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </SelectItem>
              ))}
              {showCreateOption && (
                <>
                  <div className="border-t my-1"></div>
                  <SelectItem value="create-new" className="text-primary">
                    <div className="flex items-center gap-2">
                      <FolderPlus className="h-4 w-4" />
                      Create New Folder
                    </div>
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        {/* Removed the extra "Create New Folder" button to avoid duplicates */}
      </div>
      
      {showCreateOption && (
        <FolderManager 
          folders={folders} 
          onFoldersChange={setFolders} 
          isOpen={isManagerOpen}
          onOpenChange={setIsManagerOpen}
        />
      )}
    </div>
  )
}