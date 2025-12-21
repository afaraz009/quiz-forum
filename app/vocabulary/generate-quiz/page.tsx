"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { VocabularyQuizGenerator } from "@/components/vocabulary-quiz-generator"
import { VocabularyQuizSaveDialog } from "@/components/vocabulary-quiz-save-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { QuizQuestion } from "@/types/quiz"
import type { QuestionType } from "@/types/vocabulary"

export default function GenerateVocabularyQuizPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [totalEntries, setTotalEntries] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([])
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchVocabularyCount()
    }
  }, [status, router])

  const fetchVocabularyCount = async () => {
    try {
      const response = await fetch("/api/vocabulary")
      if (response.ok) {
        const data = await response.json()
        setTotalEntries(data.total)
      }
    } catch (error) {
      console.error("Error fetching vocabulary count:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuizGenerated = (questions: QuizQuestion[], types: QuestionType[]) => {
    setGeneratedQuestions(questions)
    setQuestionTypes(types)
    setSaveDialogOpen(true)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="space-y-4 animate-slide-up">
          <Button
            variant="ghost"
            onClick={() => router.push("/vocabulary")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vocabulary
          </Button>

          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
              ✨ Quiz Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Generate Vocabulary Quiz
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Create a customized quiz from your vocabulary database with multiple question types
            </p>
          </div>
        </div>

        {/* Generator Component */}
        <VocabularyQuizGenerator
          totalEntries={totalEntries}
          onQuizGenerated={handleQuizGenerated}
        />

        {/* Save Dialog */}
        <VocabularyQuizSaveDialog
          isOpen={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          questions={generatedQuestions}
          questionTypes={questionTypes}
        />
      </div>
    </div>
  )
}
