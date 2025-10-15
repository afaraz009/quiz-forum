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

interface Folder {
  id: string
  name: string
  isDefault: boolean
}

interface FolderSelectorProps {
  value: string | null
  onValueChange: (value: string | null) => void
}

export function FolderSelector({ value, onValueChange }: FolderSelectorProps) {
  const [folders, setFolders] = useState<Folder[]>([])

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
        </SelectContent>
      </Select>
    </div>
  )
}