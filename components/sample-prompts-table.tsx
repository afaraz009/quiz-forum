"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Edit, Trash2, Copy, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SamplePromptDialog } from "@/components/sample-prompt-dialog"

interface SamplePrompt {
  id: string
  title: string
  description: string | null
  prompt: string
  createdAt: string
  updatedAt: string
}

interface SamplePromptsTableProps {
  onPromptSelect?: (prompt: string) => void
}

export function SamplePromptsTable({ onPromptSelect }: SamplePromptsTableProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [prompts, setPrompts] = useState<SamplePrompt[]>([])
  const [filteredPrompts, setFilteredPrompts] = useState<SamplePrompt[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPrompt, setSelectedPrompt] = useState<SamplePrompt | null>(null)
  const [showFullPrompt, setShowFullPrompt] = useState(false)
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<SamplePrompt | null>(null)

  const isAdmin = session?.user?.isAdmin || false

  useEffect(() => {
    fetchPrompts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPrompts(prompts)
    } else {
      const filtered = prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredPrompts(filtered)
    }
  }, [searchQuery, prompts])

  const fetchPrompts = async () => {
    try {
      setIsLoading(true)
      const url = searchQuery.trim() 
        ? `/api/sample-prompts?search=${encodeURIComponent(searchQuery)}`
        : "/api/sample-prompts"
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      } else {
        console.error("Failed to fetch sample prompts")
        toast({
          title: "Error",
          description: "Failed to load sample prompts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching prompts:", error)
      toast({
        title: "Error",
        description: "Failed to load sample prompts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRowDoubleClick = (prompt: SamplePrompt) => {
    setSelectedPrompt(prompt)
    setShowFullPrompt(true)
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "Prompt has been copied to your clipboard",
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Error",
          description: "Failed to copy prompt",
          variant: "destructive",
        })
      }
    )
  }

  const handleDeletePrompt = async (id: string) => {
    try {
      const response = await fetch(`/api/sample-prompts/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPrompts(prev => prev.filter(p => p.id !== id))
        toast({
          title: "Success",
          description: "Sample prompt deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete prompt",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting prompt:", error)
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      })
    } finally {
      setDeletePromptId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sample Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading sample prompts...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Sample Prompts</span>
            <Badge variant="secondary">{filteredPrompts.length}</Badge>
          </CardTitle>
          {isAdmin && (
            <Button size="sm" className="gap-2" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4" />
              Add Prompt
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search prompts by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No prompts found matching your search." : "No sample prompts available."}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrompts.map((prompt) => (
                  <TableRow 
                    key={prompt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onDoubleClick={() => handleRowDoubleClick(prompt)}
                    title="Double-click to view full prompt"
                  >
                    <TableCell className="font-medium">
                      {prompt.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {prompt.description ? truncateText(prompt.description, 50) : "No description"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(prompt.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyPrompt(prompt.prompt)}
                          className="gap-1"
                          title="Copy prompt"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRowDoubleClick(prompt)}
                          className="gap-1"
                          title="View full prompt"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPrompt(prompt)}
                              className="gap-1"
                              title="Edit prompt"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletePromptId(prompt.id)}
                              className="gap-1 text-destructive hover:text-destructive"
                              title="Delete prompt"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Full Prompt View Dialog */}
        <Dialog open={showFullPrompt} onOpenChange={setShowFullPrompt}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPrompt?.title}</DialogTitle>
              <DialogDescription>
                {selectedPrompt?.description || "View the complete prompt below"}
              </DialogDescription>
            </DialogHeader>
            
            {selectedPrompt && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md border">
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {selectedPrompt.prompt}
                  </pre>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(selectedPrompt.createdAt)}
                    {selectedPrompt.updatedAt !== selectedPrompt.createdAt && (
                      <span> • Updated: {formatDate(selectedPrompt.updatedAt)}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => handleCopyPrompt(selectedPrompt.prompt)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Prompt
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePromptId} onOpenChange={() => setDeletePromptId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the sample prompt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePromptId && handleDeletePrompt(deletePromptId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Prompt Dialog */}
        <SamplePromptDialog
          isOpen={showAddDialog || !!editingPrompt}
          onClose={() => {
            setShowAddDialog(false)
            setEditingPrompt(null)
          }}
          prompt={editingPrompt}
          onSuccess={() => {
            fetchPrompts()
            setShowAddDialog(false)
            setEditingPrompt(null)
          }}
        />
      </CardContent>
    </Card>
  )
}