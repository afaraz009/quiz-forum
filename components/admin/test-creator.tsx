"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { FileUploader } from "@/components/file-uploader"
import { Quiz } from "@/components/quiz"
import type { QuizQuestion } from "@/types/quiz"
import { useToast } from "@/hooks/use-toast"
import { Eye, Save, BookOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TestMetadata {
  title: string
  description: string
  timeLimit?: number
  passingPercentage: number
  isPublished: boolean
}

export function TestCreator() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [metadata, setMetadata] = useState<TestMetadata>({
    title: "",
    description: "",
    timeLimit: undefined,
    passingPercentage: 60,
    isPublished: false,
  })
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleQuestionsUpload = (uploadedQuestions: QuizQuestion[]) => {
    setQuestions(uploadedQuestions)
    toast({
      title: "Questions loaded",
      description: `Successfully loaded ${uploadedQuestions.length} questions`,
    })
  }

  const handleSaveTest = async () => {
    if (!metadata.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a test title",
        variant: "destructive",
      })
      return
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add questions to the test",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/published-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...metadata,
          questions: JSON.stringify(questions),
          totalQuestions: questions.length,
          publishedAt: metadata.isPublished ? new Date().toISOString() : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save test")
      }

      const savedTest = await response.json()
      toast({
        title: "Test saved successfully",
        description: `Test "${metadata.title}" has been ${metadata.isPublished ? 'published' : 'saved as draft'}`,
      })

      // Reset form
      setQuestions([])
      setMetadata({
        title: "",
        description: "",
        timeLimit: undefined,
        passingPercentage: 60,
        isPublished: false,
      })

    } catch (error) {
      toast({
        title: "Error saving test",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isPreviewMode && questions.length > 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{metadata.title || "Test Preview"}</h2>
            <p className="text-gray-600">{metadata.description}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(false)}
          >
            Back to Editor
          </Button>
        </div>
        <Quiz
          questions={questions}
          onComplete={() => {}}
          title={metadata.title || "Test Preview"}
          readonly={true}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Published Test</h1>
          <p className="text-gray-600">Create standardized tests for all students</p>
        </div>
        <div className="flex gap-2">
          {questions.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Test
            </Button>
          )}
          <Button
            onClick={handleSaveTest}
            disabled={isSaving || !metadata.title.trim() || questions.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Test"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metadata" className="w-full">
        <TabsList>
          <TabsTrigger value="metadata">Test Details</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle>Test Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Test Title *</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter test title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter test description (optional)"
                  className="mt-1"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={metadata.timeLimit || ""}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      timeLimit: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    placeholder="No limit"
                    className="mt-1"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Students will see a countdown timer during the test</p>
                </div>

                <div>
                  <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
                  <Input
                    id="passingPercentage"
                    type="number"
                    value={metadata.passingPercentage}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      passingPercentage: Math.max(0, Math.min(100, parseInt(e.target.value) || 60))
                    }))}
                    className="mt-1"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum percentage required to pass</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublished">Publish Test</Label>
                    <p className="text-sm text-gray-600">Make test available to students immediately</p>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={metadata.isPublished}
                    onCheckedChange={(checked) => setMetadata(prev => ({ ...prev, isPublished: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Test Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader onFileUpload={handleQuestionsUpload} />
              
              {questions.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ {questions.length} question{questions.length !== 1 ? 's' : ''} loaded successfully
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Questions include both MCQ and text-based formats
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}