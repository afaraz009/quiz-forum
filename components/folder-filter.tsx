"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, FolderPlus, FolderOpen } from "lucide-react"
import { FolderManager } from "@/components/folder-manager"

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
        <DropdownMenuContent align="start" className="w-56">
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
            </DropdownMenuItem>
          ))}
          <div className="border-t my-1"></div>
          <DropdownMenuItem onClick={() => setIsManagerOpen(true)} className="flex items-center gap-2 text-primary">
            <FolderPlus className="h-4 w-4" />
            Create New Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <FolderManager 
        folders={folders} 
        onFoldersChange={onFoldersChange} 
      />
    </div>
  )
}