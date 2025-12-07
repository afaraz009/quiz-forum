"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/file-uploader";
import { Quiz } from "@/components/quiz";
import { QuizSaveDialog } from "@/components/quiz-save-dialog";
import type { QuizQuestion } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<number | undefined>(
    undefined
  );
  const [currentAnswers, setCurrentAnswers] = useState<
    Record<number, string> | undefined
  >(undefined);

  const handleFileUpload = (parsedQuestions: QuizQuestion[]) => {
    setQuestions(parsedQuestions);
    setIsLoaded(true);
    setSavedQuizId(null); // Reset saved quiz ID for new upload
    setCurrentScore(undefined);
    setCurrentAnswers(undefined);
  };

  const handleSaveQuiz = () => {
    setShowSaveDialog(true);
  };

  const handleSaveSuccess = (quizId: string) => {
    setSavedQuizId(quizId);
  };

  const handleQuizComplete = (
    score: number,
    answers: Record<number, string>
  ) => {
    setCurrentScore(score);
    setCurrentAnswers(answers);
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="text-center space-y-12 min-h-[600px] flex flex-col justify-center">
          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
              🎯 Interactive Learning Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Welcome to Quiz Forum
            </h1>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Transform your learning experience with interactive quizzes,
              real-time feedback, and comprehensive progress tracking. Join
              thousands of learners advancing their knowledge.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Get Started Today
              <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg rounded-xl hover:bg-muted/50"
              onClick={() => router.push("/signup")}
            >
              Create Account
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-slide-up">
            <div className="text-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                📚
              </div>
              <h3 className="font-semibold text-lg">Interactive Quizzes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Engage with dynamic quizzes designed to reinforce learning and
                test comprehension effectively.
              </p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                📊
              </div>
              <h3 className="font-semibold text-lg">Progress Tracking</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Monitor your learning journey with detailed analytics and
                performance insights.
              </p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-xl bg-card border hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                🎖️
              </div>
              <h3 className="font-semibold text-lg">Achievement System</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Earn recognition for your progress and celebrate learning
                milestones.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      {!isLoaded ? (
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 mb-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
          <div className="text-center mb-6">
            {/* Removed emoji above Upload Quiz Questions */}
            <h2 className="text-2xl font-bold mb-2">Upload Quiz Questions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Upload a JSON file containing quiz questions. The file should be
              formatted with questions, options, and correct answers.
            </p>
          </div>
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                ✅
              </div>
              <div>
                <h3 className="font-semibold">Quiz Loaded Successfully</h3>
                <p className="text-sm text-muted-foreground">
                  {questions.length} questions ready
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsLoaded(false)}
                className="rounded-lg flex-1 sm:flex-none"
              >
                Load New Quiz
              </Button>
              {!savedQuizId && (
                <Button
                  onClick={handleSaveQuiz}
                  className="rounded-lg flex-1 sm:flex-none"
                >
                  Save Quiz
                </Button>
              )}
              {savedQuizId && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-lg flex-1 sm:flex-none"
                >
                  View Dashboard
                </Button>
              )}
            </div>
          </div>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-lg">
            <Quiz
              questions={questions}
              savedQuizId={savedQuizId}
              onQuizComplete={handleQuizComplete}
            />
          </div>
          <QuizSaveDialog
            isOpen={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            questions={questions}
            onSaveSuccess={handleSaveSuccess}
            currentScore={currentScore}
            currentAnswers={currentAnswers}
          />
        </div>
      )}
      {/* Dashboard button for authenticated users on homepage */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => router.push("/dashboard")}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          Dashboard
          <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
            ↗
          </span>
        </Button>
      </div>
    </div>
  );
}
