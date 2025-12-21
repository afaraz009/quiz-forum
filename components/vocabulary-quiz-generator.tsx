"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles } from "lucide-react"
import type { QuestionType } from "@/types/vocabulary"
import type { QuizQuestion } from "@/types/quiz"

interface VocabularyQuizGeneratorProps {
  totalEntries: number
  onQuizGenerated: (questions: QuizQuestion[], questionTypes: QuestionType[]) => void
}

export function VocabularyQuizGenerator({
  totalEntries,
  onQuizGenerated,
}: VocabularyQuizGeneratorProps) {
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([])
  const [questionCount, setQuestionCount] = useState(20)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const questionTypeOptions = [
    {
      id: "word-to-meaning" as QuestionType,
      label: "Word → Definition",
      description: "Test meaning/definition knowledge",
      icon: "📖",
    },
    {
      id: "word-to-urdu" as QuestionType,
      label: "Word → Urdu Translation",
      description: "Test Urdu translation skills",
      icon: "🇵🇰",
    },
    {
      id: "word-to-usage" as QuestionType,
      label: "Word → Usage in Sentence",
      description: "Test contextual usage understanding",
      icon: "✍️",
    },
  ]

  const handleTypeToggle = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleGenerateQuiz = async () => {
    // Validation
    if (selectedTypes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one question type",
        variant: "destructive",
      })
      return
    }

    if (questionCount < 1 || questionCount > 100) {
      toast({
        title: "Validation Error",
        description: "Question count must be between 1 and 100",
        variant: "destructive",
      })
      return
    }

    if (questionCount > totalEntries) {
      toast({
        title: "Validation Error",
        description: `You only have ${totalEntries} vocabulary entries. Cannot generate ${questionCount} questions.`,
        variant: "destructive",
      })
      return
    }

    if (totalEntries < 4) {
      toast({
        title: "Insufficient Vocabulary",
        description: "You need at least 4 vocabulary entries to generate a quiz with distractors",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/vocabulary-quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionTypes: selectedTypes,
          questionCount,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Quiz Generated!",
          description: `Created ${data.questions.length} questions successfully`,
        })
        onQuizGenerated(data.questions, selectedTypes)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate quiz",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the quiz",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generate Vocabulary Quiz
        </CardTitle>
        <CardDescription>
          Create a customized quiz from your vocabulary database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Types Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Question Types</Label>
          <p className="text-sm text-muted-foreground">
            Select one or more question types for your quiz
          </p>
          <div className="space-y-3">
            {questionTypeOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedTypes.includes(option.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleTypeToggle(option.id)}
              >
                <Checkbox
                  id={option.id}
                  checked={selectedTypes.includes(option.id)}
                  onCheckedChange={() => handleTypeToggle(option.id)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={option.id}
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-3">
          <Label htmlFor="questionCount" className="text-base font-semibold">
            Number of Questions
          </Label>
          <Input
            id="questionCount"
            type="number"
            min={1}
            max={Math.min(100, totalEntries)}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            Choose between 1 and {Math.min(100, totalEntries)} questions
          </p>
        </div>

        {/* Preview Information */}
        {selectedTypes.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Preview: Will generate {questionCount} question{questionCount !== 1 ? "s" : ""} from{" "}
              {totalEntries} vocabulary entr{totalEntries !== 1 ? "ies" : "y"}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Selected types: {selectedTypes.length}
            </p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerateQuiz}
          disabled={isGenerating || totalEntries < 4}
          size="lg"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Quiz
            </>
          )}
        </Button>

        {totalEntries < 4 && (
          <p className="text-xs text-center text-muted-foreground">
            You need at least 4 vocabulary entries to generate a quiz
          </p>
        )}
      </CardContent>
    </Card>
  )
}
