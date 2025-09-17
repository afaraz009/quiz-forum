"use client"

import { useState } from "react"
import type { QuizQuestion } from "@/types/quiz"
import { Button } from "@/components/ui/button"
import { QuestionItem } from "@/components/question-item"
import { CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface QuizProps {
  questions: QuizQuestion[]
  savedQuizId?: string | null
  onQuizComplete?: (score: number, answers: Record<number, string>) => void
  onSubmit?: (answers: Record<number, string>) => void
  onAnswerChange?: (answers: Record<number, string>) => void
  title?: string
  readonly?: boolean
  isAssessmentMode?: boolean
}

export function Quiz({ questions, savedQuizId, onQuizComplete, onSubmit, onAnswerChange, title, readonly = false, isAssessmentMode = false }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (submitted || readonly) return

    const newAnswers = {
      ...selectedAnswers,
      [questionIndex]: answer,
    }

    setSelectedAnswers(newAnswers)

    // Call the answer change callback if provided
    if (onAnswerChange) {
      onAnswerChange(newAnswers)
    }
  }

  const normalizeAnswer = (answer: string) => {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  const handleSubmit = async () => {
    // For assessment mode, use custom onSubmit handler
    if (isAssessmentMode && onSubmit) {
      onSubmit(selectedAnswers)
      return
    }

    const correctAnswers = questions.reduce((count, question, index) => {
      const userAnswer = selectedAnswers[index]
      if (!userAnswer) return count

      // For MCQ questions, exact match is required
      if (question.options) {
        return userAnswer === question.correctAnswer ? count + 1 : count
      }

      // For short answer questions, use normalized comparison
      return normalizeAnswer(userAnswer) === normalizeAnswer(question.correctAnswer) ? count + 1 : count
    }, 0)

    setScore(correctAnswers)
    setSubmitted(true)

    // Notify parent component about quiz completion
    onQuizComplete?.(correctAnswers, selectedAnswers)

    // Save attempt if quiz is saved
    if (savedQuizId) {
      try {
        const response = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: savedQuizId,
            score: correctAnswers,
            totalQuestions: questions.length,
            answers: selectedAnswers,
          }),
        })

        if (response.ok) {
          toast.success("Quiz results saved to your history!")
        } else {
          console.error("Failed to save quiz attempt")
        }
      } catch (error) {
        console.error("Error saving quiz attempt:", error)
      }
    }
  }

  const handleReset = () => {
    setSelectedAnswers({})
    setSubmitted(false)
    setScore(null)
  }

  const allQuestionsAnswered = Object.keys(selectedAnswers).length === questions.length

  return (
    <div className={`bg-background border rounded-lg shadow-md p-6 ${
      isAssessmentMode ? 'border-orange-300 bg-orange-50/10' : ''
    }`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {title || "Quiz Questions"}
            {isAssessmentMode && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                Assessment Mode
              </span>
            )}
          </h2>
          {!submitted && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{Object.keys(selectedAnswers).length} / {questions.length}</span>
              <div className="text-xs text-muted-foreground">answered</div>
            </div>
          )}
        </div>
        {!submitted && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="space-y-8 mb-8">
        {questions.map((question, index) => (
          <QuestionItem
            key={index}
            question={question}
            index={index}
            selectedAnswer={selectedAnswers[index]}
            onSelectAnswer={handleAnswerSelect}
            submitted={submitted}
          />
        ))}
      </div>

      {!readonly && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          {submitted ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">
                  Your Score: {score} / {questions.length}
                </span>
                {score === questions.length ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <Button onClick={handleReset}>Try Again</Button>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                {allQuestionsAnswered
                  ? "All questions answered. Ready to submit!"
                  : `${Object.keys(selectedAnswers).length} of ${questions.length} questions answered`}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
                className={isAssessmentMode ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                {isAssessmentMode ? 'Submit Test' : 'Submit Answers'}
              </Button>
            </>
          )}
        </div>
      )}
      
      {readonly && (
        <div className="pt-4 border-t">
          <div className="text-center text-muted-foreground">
            Preview mode - This is how students will see the test
          </div>
        </div>
      )}
    </div>
  )
}
