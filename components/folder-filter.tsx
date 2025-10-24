"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, FolderPlus, FolderOpen, Pen, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Folder {
  id: string
  name: string
  isDefault: boolean
}

interface FolderFilterProps {
  folders: Folder[]
  selectedFolder: string | null
  onFolderSelect: (folderId: string | null) => void
  onFoldersChange: (folders: Folder[]) => void
}

export function FolderFilter({ folders, selectedFolder, onFolderSelect, onFoldersChange }: FolderFilterProps) {
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  
  // Find the selected folder name for display
  let selectedFolderName = "All Quizzes"
  if (selectedFolder === "uncategorized") {
    selectedFolderName = "Uncategorized"
  } else if (selectedFolder) {
    const folder = folders.find(f => f.id === selectedFolder)
    if (folder) {
      selectedFolderName = folder.name
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
        
        // If the deleted folder was selected, reset to all quizzes
        if (selectedFolder === folderId) {
          onFolderSelect(null)
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
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {selectedFolderName}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="w-56">
          <DropdownMenuItem onClick={() => onFolderSelect(null)}>
            All Quizzes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFolderSelect("uncategorized")}>
            Uncategorized
          </DropdownMenuItem>
          <div className="border-t my-1"></div>
          {folders.filter(f => !f.isDefault).map(folder => (
            <DropdownMenuItem 
              key={folder.id} 
              onClick={() => onFolderSelect(folder.id)}
              className="flex items-center justify-between"
            >
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
            </DropdownMenuItem>
          ))}
          <div className="border-t my-1"></div>
          <DropdownMenuItem onClick={() => setIsManagerOpen(true)} className="flex items-center gap-2 text-primary">
            <FolderPlus className="h-4 w-4" />
            Create New Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Removed the extra "Create New Folder" button */}
    </div>
  )
}