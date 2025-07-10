"use client"

import type { QuizQuestion } from "@/types/quiz"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle } from "lucide-react"

interface QuestionItemProps {
  question: QuizQuestion
  index: number
  selectedAnswer: string | undefined
  onSelectAnswer: (index: number, answer: string) => void
  submitted: boolean
}

export function QuestionItem({ question, index, selectedAnswer, onSelectAnswer, submitted }: QuestionItemProps) {
  const normalizeAnswer = (answer: string) => {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  const isCorrect = selectedAnswer 
    ? normalizeAnswer(selectedAnswer) === normalizeAnswer(question.correctAnswer)
    : false

  const isShortAnswer = !question.options

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium text-card-foreground">
          Question {index + 1}: {question.question}
        </h3>
        {submitted && (
          <div className="ml-2 flex-shrink-0">
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {isShortAnswer ? (
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter your answer..."
            value={selectedAnswer || ''}
            onChange={(e) => onSelectAnswer(index, e.target.value)}
            disabled={submitted}
            className={`${submitted ? (isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950') : ''}`}
          />
          {submitted && (
            <div className="text-sm">
              <div className="text-muted-foreground">
                Correct answer: <span className="font-medium text-green-600 dark:text-green-400">{question.correctAnswer}</span>
              </div>
              {!isCorrect && selectedAnswer && (
                <div className="text-muted-foreground">
                  Your answer: <span className="font-medium text-red-600 dark:text-red-400">{selectedAnswer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <RadioGroup value={selectedAnswer} onValueChange={(value) => onSelectAnswer(index, value)} className="space-y-2">
          {question.options?.map((option, optionIndex) => {
            const isSelected = selectedAnswer === option
            const isCorrectAnswer = option === question.correctAnswer

            let optionClassName = "flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors hover:bg-muted/50"

            if (submitted) {
              if (isCorrectAnswer) {
                optionClassName += " bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
              } else if (isSelected && !isCorrectAnswer) {
                optionClassName += " bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
              }
            } else if (isSelected) {
              optionClassName += " bg-accent border-accent-foreground/20"
            }

            return (
              <Label key={optionIndex} htmlFor={`q${index}-option${optionIndex}`} className={optionClassName}>
                <RadioGroupItem
                  value={option}
                  id={`q${index}-option${optionIndex}`}
                  disabled={submitted}
                  className="sr-only"
                />
                <span className="flex-grow text-card-foreground">
                  {option}
                </span>
                {submitted && isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                {submitted && isSelected && !isCorrectAnswer && (
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </Label>
            )
          })}
        </RadioGroup>
      )}
    </div>
  )
}
