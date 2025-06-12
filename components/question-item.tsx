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
  textAnswer: string
  onSelectAnswer: (index: number, answer: string) => void
  onTextAnswerChange: (index: number, answer: string) => void
  submitted: boolean
}

export function QuestionItem({
  question,
  index,
  selectedAnswer,
  textAnswer,
  onSelectAnswer,
  onTextAnswerChange,
  submitted,
}: QuestionItemProps) {
  // For MCQ questions
  const isCorrect = question.options
    ? selectedAnswer === question.correctAnswer
    : textAnswer.trim().toLowerCase() === question.correctAnswer.toLowerCase()

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium">
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

      {question.options ? (
        // Multiple choice question
        <RadioGroup
          value={selectedAnswer}
          onValueChange={(value) => onSelectAnswer(index, value)}
          className="space-y-2"
        >
          {question.options.map((option, optionIndex) => {
            const isSelected = selectedAnswer === option
            const isCorrectAnswer = option === question.correctAnswer

            let optionClassName = "flex items-center space-x-2 rounded-md border p-3 cursor-pointer"

            if (submitted) {
              if (isCorrectAnswer) {
                optionClassName += " bg-green-50 border-green-200"
              } else if (isSelected && !isCorrectAnswer) {
                optionClassName += " bg-red-50 border-red-200"
              }
            } else if (isSelected) {
              optionClassName += " bg-gray-100"
            }

            return (
              <div
                key={optionIndex}
                className={optionClassName}
                onClick={() => {
                  if (!submitted) {
                    onSelectAnswer(index, option)
                  }
                }}
              >
                <RadioGroupItem
                  value={option}
                  id={`q${index}-option${optionIndex}`}
                  disabled={submitted}
                  className="sr-only"
                />
                <Label htmlFor={`q${index}-option${optionIndex}`} className="flex-grow cursor-pointer w-full">
                  {option}
                </Label>
                {submitted && isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                {submitted && isSelected && !isCorrectAnswer && (
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </RadioGroup>
      ) : (
        // Text answer question
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Type your answer here..."
              value={textAnswer}
              onChange={(e) => onTextAnswerChange(index, e.target.value)}
              disabled={submitted}
              className={submitted && !isCorrect ? "border-red-300" : ""}
            />
          </div>

          {submitted && !isCorrect && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">
                Correct answer: <span className="font-bold">{question.correctAnswer}</span>
              </p>
            </div>
          )}

          {submitted && isCorrect && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">Correct!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
