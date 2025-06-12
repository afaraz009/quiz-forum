"use client"

import { useState } from "react"
import type { QuizQuestion } from "@/types/quiz"
import { Button } from "@/components/ui/button"
import { QuestionItem } from "@/components/question-item"
import { CheckCircle, XCircle, RotateCcw } from "lucide-react"

interface QuizProps {
  questions: QuizQuestion[]
  onReset?: () => void
}

export function Quiz({ questions, onReset }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (submitted) return

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }))
  }

  const handleTextAnswerChange = (questionIndex: number, answer: string) => {
    if (submitted) return

    setTextAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }))
  }

  const handleSubmit = () => {
    let correctCount = 0

    // Check MCQ answers
    questions.forEach((question, index) => {
      if (question.options) {
        // This is an MCQ
        if (selectedAnswers[index] === question.correctAnswer) {
          correctCount++
        }
      } else {
        // This is a text answer question
        const userAnswer = textAnswers[index]?.trim().toLowerCase() || ""
        const correctAnswer = question.correctAnswer.toLowerCase()

        if (userAnswer === correctAnswer) {
          correctCount++
        }
      }
    })

    setScore(correctCount)
    setSubmitted(true)
  }

  const handleReset = () => {
    setSelectedAnswers({})
    setTextAnswers({})
    setSubmitted(false)
    setScore(null)
  }

  const allQuestionsAnswered = questions.every((question, index) => {
    if (question.options) {
      return selectedAnswers[index] !== undefined
    } else {
      return textAnswers[index] !== undefined && textAnswers[index].trim() !== ""
    }
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Quiz Questions</h2>

      <div className="space-y-8 mb-8">
        {questions.map((question, index) => (
          <QuestionItem
            key={index}
            question={question}
            index={index}
            selectedAnswer={selectedAnswers[index]}
            textAnswer={textAnswers[index] || ""}
            onSelectAnswer={handleAnswerSelect}
            onTextAnswerChange={handleTextAnswerChange}
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
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              {onReset && (
                <Button onClick={onReset} variant="secondary" className="flex items-center gap-2">
                  New Quiz
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-500">
              {allQuestionsAnswered
                ? "All questions answered. Ready to submit!"
                : `${
                    questions.filter((q, i) =>
                      q.options
                        ? selectedAnswers[i] !== undefined
                        : textAnswers[i] !== undefined && textAnswers[i].trim() !== "",
                    ).length
                  } of ${questions.length} questions answered`}
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
