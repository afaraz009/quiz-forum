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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { VocabularyEntry } from "@/types/vocabulary"

interface VocabularyEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  entry?: VocabularyEntry | null
  mode: "add" | "edit"
}

export function VocabularyEntryDialog({
  isOpen,
  onClose,
  onSuccess,
  entry,
  mode,
}: VocabularyEntryDialogProps) {
  const [word, setWord] = useState("")
  const [meaning, setMeaning] = useState("")
  const [urduTranslation, setUrduTranslation] = useState("")
  const [usageExample, setUsageExample] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && entry) {
        setWord(entry.word)
        setMeaning(entry.meaning)
        setUrduTranslation(entry.urduTranslation)
        setUsageExample(entry.usageExample)
      } else {
        setWord("")
        setMeaning("")
        setUrduTranslation("")
        setUsageExample("")
      }
    }
  }, [isOpen, mode, entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!word.trim() || !meaning.trim() || !urduTranslation.trim() || !usageExample.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === "add") {
        // Add new entry
        const response = await fetch("/api/vocabulary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: word.trim(),
            meaning: meaning.trim(),
            urduTranslation: urduTranslation.trim(),
            usageExample: usageExample.trim(),
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({
            title: "Success!",
            description: "Vocabulary entry added successfully",
          })
          onSuccess()
          onClose()
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to add vocabulary entry",
            variant: "destructive",
          })
        }
      } else if (mode === "edit" && entry) {
        // Update existing entry
        const response = await fetch(`/api/vocabulary/${entry.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: word.trim(),
            meaning: meaning.trim(),
            urduTranslation: urduTranslation.trim(),
            usageExample: usageExample.trim(),
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({
            title: "Success!",
            description: "Vocabulary entry updated successfully",
          })
          onSuccess()
          onClose()
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update vocabulary entry",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Vocabulary Entry" : "Edit Vocabulary Entry"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new word to your vocabulary database"
              : "Update the vocabulary entry details"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="word">Word *</Label>
              <Input
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g., Eventually"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meaning">Meaning/Definition *</Label>
              <Textarea
                id="meaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="e.g., After a long time, or in the end."
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urduTranslation">Urdu Translation *</Label>
              <Input
                id="urduTranslation"
                value={urduTranslation}
                onChange={(e) => setUrduTranslation(e.target.value)}
                placeholder="e.g., آخر کار"
                required
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageExample">Usage in a Sentence *</Label>
              <Textarea
                id="usageExample"
                value={usageExample}
                onChange={(e) => setUsageExample(e.target.value)}
                placeholder="e.g., After months of practice, she eventually learned to play the guitar."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "add" ? "Add Entry" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
