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
  const isAnswered = selectedAnswer !== undefined && selectedAnswer !== ''

  // Determine card styling based on answer state
  let cardClassName = "rounded-lg p-4 bg-card transition-all duration-200"

  if (submitted) {
    cardClassName += isCorrect
      ? " border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/50"
      : " border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/50"
  } else if (isAnswered) {
    cardClassName += " border-2 border-primary/60 bg-primary/5"
  } else {
    cardClassName += " border border-border"
  }

  return (
    <div className={`${cardClassName} quiz-content`}
    onContextMenu={(e) => {
      e.preventDefault();
      return false;
    }}
    onDragStart={(e) => {
      e.preventDefault();
      return false;
    }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-card-foreground select-none">
            Question {index + 1}: {question.question}
          </h3>
          {!submitted && (
            <div className="flex items-center gap-1">
              {isAnswered ? (
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              ) : (
                <div className="w-2 h-2 rounded-full border border-muted-foreground"></div>
              )}
            </div>
          )}
        </div>
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
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Enter your answer..."
            value={selectedAnswer || ''}
            onChange={(e) => onSelectAnswer(index, e.target.value)}
            disabled={submitted}
            className={`rounded-lg ${submitted ? (isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950') : isAnswered ? 'border-primary' : ''}`}
          />
          {submitted && (
            <div className="text-sm space-y-1">
              <div className="text-muted-foreground select-none">
                Correct answer: <span className="font-medium text-green-600 dark:text-green-400">{question.correctAnswer}</span>
              </div>
              {!isCorrect && selectedAnswer && (
                <div className="text-muted-foreground select-none">
                  Your answer: <span className="font-medium text-red-600 dark:text-red-400">{selectedAnswer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <RadioGroup value={selectedAnswer} onValueChange={(value) => onSelectAnswer(index, value)} className="space-y-3">
          {question.options?.map((option, optionIndex) => {
            const isSelected = selectedAnswer === option
            const isCorrectAnswer = option === question.correctAnswer

            let optionClassName = "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200"

            if (submitted) {
              if (isCorrectAnswer) {
                optionClassName += " bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-600"
              } else if (isSelected && !isCorrectAnswer) {
                optionClassName += " bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-600"
              } else {
                optionClassName += " border-border hover:bg-muted/30"
              }
            } else if (isSelected) {
              // Selected state - this should override hover
              optionClassName += " bg-primary/10 border-primary text-primary-foreground"
            } else {
              // Unselected state with hover
              optionClassName += " border-border hover:bg-muted/50 hover:border-muted-foreground/30"
            }

            return (
              <Label key={optionIndex} htmlFor={`q${index}-option${optionIndex}`} className={optionClassName}>
                <div className="flex items-center space-x-3 w-full">
                  <RadioGroupItem
                    value={option}
                    id={`q${index}-option${optionIndex}`}
                    disabled={submitted}
                    className={`${isSelected && !submitted ? 'border-primary text-primary' : ''}`}
                  />
                  <span className="flex-grow text-card-foreground font-medium select-none">
                    {option}
                  </span>
                  <div className="flex-shrink-0">
                    {submitted && isCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {submitted && isSelected && !isCorrectAnswer && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {!submitted && isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
              </Label>
            )
          })}
        </RadioGroup>
      )}
    </div>
  )
}
