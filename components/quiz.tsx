"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { QuizQuestion } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { QuestionItem } from "@/components/question-item";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { shuffleArrayWithSeed, generateSeed } from "@/lib/utils";

interface QuizProps {
  questions: QuizQuestion[];
  savedQuizId?: string | null;
  onQuizComplete?: (score: number, answers: Record<number, string>) => void;
  onSubmit?: (answers: Record<number, string>) => void;
  onAnswerChange?: (answers: Record<number, string>) => void;
  title?: string;
  readonly?: boolean;
  isAssessmentMode?: boolean;
  hideProgressBar?: boolean; // Option to hide the built-in progress bar for sticky headers
}

export function Quiz({
  questions,
  savedQuizId,
  onQuizComplete,
  onSubmit,
  onAnswerChange,
  title,
  readonly = false,
  isAssessmentMode = false,
  hideProgressBar = false,
}: QuizProps) {
  const { data: session } = useSession();
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>(
    []
  );

  // Shuffle options for each question based on user-specific seed
  useEffect(() => {
    if (questions.length > 0) {
      const userId = session?.user?.email || "anonymous";
      const processedQuestions = questions.map((question, index) => {
        // Only shuffle if question has options (MCQ)
        if (question.options && question.options.length > 1) {
          const seed = generateSeed(`${userId}-${question.question}-${index}`);
          const shuffledOptions = shuffleArrayWithSeed(question.options, seed);

          // Find the new index of the correct answer after shuffling
          const originalCorrectIndex = question.options.indexOf(
            question.correctAnswer
          );
          const shuffledCorrectIndex = shuffledOptions.indexOf(
            question.correctAnswer
          );

          return {
            ...question,
            shuffledOptions,
            originalCorrectIndex,
            shuffledCorrectIndex,
          };
        }

        // For short answer questions, no shuffling needed
        return question;
      });

      setShuffledQuestions(processedQuestions);
    }
  }, [questions, session?.user?.email]);

  // Add protection against copying in assessment mode
  useEffect(() => {
    if (isAssessmentMode) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+X (Cut), Ctrl+V (Paste)
        if (
          e.ctrlKey &&
          (e.key === "a" || e.key === "c" || e.key === "x" || e.key === "v")
        ) {
          e.preventDefault();
          return false;
        }
        // Prevent F12 (Developer Tools)
        if (e.key === "F12") {
          e.preventDefault();
          return false;
        }
        // Prevent Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === "I") {
          e.preventDefault();
          return false;
        }
        // Prevent Ctrl+U (View Source)
        if (e.ctrlKey && e.key === "u") {
          e.preventDefault();
          return false;
        }
      };

      const handleContextMenu = (e: Event) => {
        e.preventDefault();
        return false;
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("contextmenu", handleContextMenu);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, [isAssessmentMode]);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (submitted || readonly) return;

    const newAnswers = {
      ...selectedAnswers,
      [questionIndex]: answer,
    };

    setSelectedAnswers(newAnswers);

    // Call the answer change callback if provided
    if (onAnswerChange) {
      onAnswerChange(newAnswers);
    }
  };

  const normalizeAnswer = (answer: string) => {
    return answer.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const handleSubmit = async () => {
    // For assessment mode, use custom onSubmit handler
    if (isAssessmentMode && onSubmit) {
      onSubmit(selectedAnswers);
      return;
    }

    const correctAnswers = shuffledQuestions.reduce(
      (count, question, index) => {
        const userAnswer = selectedAnswers[index];
        if (!userAnswer) return count;

        // For MCQ questions, exact match is required
        if (question.options) {
          return userAnswer === question.correctAnswer ? count + 1 : count;
        }

        // For short answer questions, use normalized comparison
        return normalizeAnswer(userAnswer) ===
          normalizeAnswer(question.correctAnswer)
          ? count + 1
          : count;
      },
      0
    );

    setScore(correctAnswers);
    setSubmitted(true);

    // Notify parent component about quiz completion
    onQuizComplete?.(correctAnswers, selectedAnswers);

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
            totalQuestions: shuffledQuestions.length,
            answers: selectedAnswers,
          }),
        });

        if (response.ok) {
          toast.success("Quiz results saved to your history!");
        } else {
          console.error("Failed to save quiz attempt");
        }
      } catch (error) {
        console.error("Error saving quiz attempt:", error);
      }
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  const allQuestionsAnswered =
    Object.keys(selectedAnswers).length === shuffledQuestions.length;

  return (
    <div
      className={`bg-background border rounded-lg shadow-md p-6 quiz-content ${
        isAssessmentMode ? "border-orange-300 bg-orange-50/10" : ""
      }`}
      onContextMenu={(e) => {
        if (isAssessmentMode) {
          e.preventDefault();
          return false;
        }
      }}
      onDragStart={(e) => {
        if (isAssessmentMode) {
          e.preventDefault();
          return false;
        }
      }}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 select-none">
            {title || "Quiz Questions"}
            {isAssessmentMode && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full select-none">
                Assessment Mode
              </span>
            )}
          </h2>
          {!submitted && !hideProgressBar && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {Object.keys(selectedAnswers).length} /{" "}
                {shuffledQuestions.length}
              </span>
              <div className="text-xs text-muted-foreground select-none">
                answered
              </div>
            </div>
          )}
        </div>
        {!submitted && !hideProgressBar && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (Object.keys(selectedAnswers).length /
                    shuffledQuestions.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
        )}
      </div>

      <div className="space-y-8 mb-8">
        {shuffledQuestions.map((question, index) => (
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
                  Your Score: {score} / {shuffledQuestions.length}
                </span>
                {score === shuffledQuestions.length ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <Button onClick={handleReset}>Try Again</Button>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground select-none">
                {allQuestionsAnswered
                  ? "All questions answered. Ready to submit!"
                  : `${Object.keys(selectedAnswers).length} of ${
                      shuffledQuestions.length
                    } questions answered`}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
                className={
                  isAssessmentMode ? "bg-orange-600 hover:bg-orange-700" : ""
                }
              >
                {isAssessmentMode ? "Submit Test" : "Submit Answers"}
              </Button>
            </>
          )}
        </div>
      )}

      {readonly && (
        <div className="pt-4 border-t">
          <div className="text-center text-muted-foreground select-none">
            Preview mode - This is how students will see the test
          </div>
        </div>
      )}
    </div>
  );
}
