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
import { FolderPlus } from "lucide-react"
import { FolderManager } from "@/components/folder-manager"

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
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
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