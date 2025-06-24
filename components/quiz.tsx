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
}

export function Quiz({ questions, savedQuizId }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (submitted) return

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }))
  }

  const handleSubmit = async () => {
    const correctAnswers = questions.reduce((count, question, index) => {
      return selectedAnswers[index] === question.correctAnswer ? count + 1 : count
    }, 0)

    setScore(correctAnswers)
    setSubmitted(true)

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
    <div className="bg-background border rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Quiz Questions</h2>

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
            <Button onClick={handleSubmit} disabled={!allQuestionsAnswered}>
              Submit Answers
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
