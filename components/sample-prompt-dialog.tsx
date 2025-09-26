"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface SamplePrompt {
  id: string
  title: string
  description: string | null
  prompt: string
  createdAt: string
  updatedAt: string
}

interface SamplePromptDialogProps {
  isOpen: boolean
  onClose: () => void
  prompt?: SamplePrompt | null
  onSuccess: () => void
}

export function SamplePromptDialog({ 
  isOpen, 
  onClose, 
  prompt, 
  onSuccess 
}: SamplePromptDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prompt: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!prompt

  useEffect(() => {
    if (isOpen) {
      if (isEditing && prompt) {
        setFormData({
          title: prompt.title,
          description: prompt.description || "",
          prompt: prompt.prompt
        })
      } else {
        setFormData({
          title: "",
          description: "",
          prompt: ""
        })
      }
      setErrors({})
    }
  }, [isOpen, isEditing, prompt])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.prompt.trim()) {
      newErrors.prompt = "Prompt content is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const url = isEditing ? `/api/sample-prompts/${prompt!.id}` : "/api/sample-prompts"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          prompt: formData.prompt.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Sample prompt ${isEditing ? "updated" : "created"} successfully`,
        })
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${isEditing ? "update" : "create"} prompt`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving prompt:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} prompt`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Sample Prompt" : "Add New Sample Prompt"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the sample prompt details below"
              : "Create a new sample prompt that users can use for generating quizzes"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for the prompt"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of what this prompt generates (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Content *</Label>
            <Textarea
              id="prompt"
              placeholder="Enter the full prompt content that will be used for AI generation"
              value={formData.prompt}
              onChange={(e) => handleInputChange("prompt", e.target.value)}
              className={`min-h-[300px] font-mono text-sm ${errors.prompt ? "border-destructive" : ""}`}
            />
            {errors.prompt && (
              <p className="text-sm text-destructive">{errors.prompt}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This is the complete prompt that users will copy and use with AI assistants to generate quiz questions.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isEditing ? "Updating..." : "Creating..."}
                </div>
              ) : (
                isEditing ? "Update Prompt" : "Create Prompt"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}