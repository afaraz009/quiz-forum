"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DifficultySelector } from "@/components/translation-practice/difficulty-selector";
import { ParagraphDisplay } from "@/components/translation-practice/paragraph-display";
import { TranslationInput } from "@/components/translation-practice/translation-input";
import { FeedbackTable } from "@/components/translation-practice/feedback-table";
import { ApiKeySetupBanner } from "@/components/translation-practice/api-key-setup-banner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, RefreshCw, History } from "lucide-react";
import type { FeedbackRow } from "@/lib/parse-gemini-feedback";
import Link from "next/link";

type PracticeState = "setup" | "practice" | "feedback";

interface PassageData {
  id: string;
  urduParagraph: string;
  difficultyLevel: number;
}

interface FeedbackData {
  feedback: FeedbackRow[];
  naturalVersion: string;
  score: number;
  passageStats: {
    highestScore: number;
    recentScore: number;
    totalAttempts: number;
  };
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  2: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  3: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function TranslationPracticeClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passageIdFromUrl = searchParams.get("passageId");

  const [state, setState] = useState<PracticeState>("setup");
  const [passageData, setPassageData] = useState<PassageData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log("Feedback data: ", feedbackData);

  // Check auth
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user has API key
  useEffect(() => {
    if (status === "authenticated") {
      checkApiKey();
    }
  }, [status]);

  // Load existing passage if passageId is provided
  useEffect(() => {
    if (status === "authenticated" && passageIdFromUrl) {
      loadExistingPassage(passageIdFromUrl);
    }
  }, [status, passageIdFromUrl]);

  const checkApiKey = async () => {
    try {
      const res = await fetch("/api/settings/gemini-key");
      const data = await res.json();
      setHasApiKey(data.hasKey);
    } catch (error) {
      console.error("Failed to check API key:", error);
    }
  };

  const loadExistingPassage = async (passageId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/translation/passages/${passageId}`);
      if (!res.ok) {
        throw new Error("Failed to load passage");
      }

      const data = await res.json();
      setPassageData({
        id: data.id,
        urduParagraph: data.urduParagraph,
        difficultyLevel: data.difficultyLevel,
      });
      setState("practice");
    } catch (error) {
      toast.error("Failed to load passage");
      router.push("/translation-practice");
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewPassage = async (difficultyLevel: number) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/translation/passages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficultyLevel }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate passage");
      }

      const data = await res.json();
      setPassageData({
        id: data.passageId,
        urduParagraph: data.urduParagraph,
        difficultyLevel: data.difficultyLevel,
      });
      setState("practice");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate passage"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitTranslation = async (translation: string) => {
    if (!passageData) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/translation/passages/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passageId: passageData.id,
          userTranslation: translation,
        }),
      });

      console.log("Raw Api response data: ", res);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit translation");
      }

      const data = await res.json();

      console.log("Parsed api respone data: ", data);
      console.log("here is the response: ", data);
      setFeedbackData({
        feedback: data.feedback,
        naturalVersion: data.naturalVersion,
        score: data.score,
        passageStats: data.passageStats,
      });
      setState("feedback");
      toast.success("Translation submitted!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit translation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setState("practice");
    setFeedbackData(null);
  };

  const handleNewPassage = async () => {
    if (!passageData) return;
    await generateNewPassage(passageData.difficultyLevel);
    setFeedbackData(null);
  };

  const handleBackToSetup = () => {
    setState("setup");
    setPassageData(null);
    setFeedbackData(null);
    // Remove passageId from URL if present
    if (passageIdFromUrl) {
      router.push("/translation-practice");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (status === "loading" || hasApiKey === null) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Urdu-English Translation Practice
        </h1>
        <Button variant="outline" asChild>
          <Link href="/translation-practice/history">
            <History className="mr-2 h-4 w-4" />
            View History
          </Link>
        </Button>
      </div>

      {!hasApiKey && <ApiKeySetupBanner />}

      {passageData && state !== "setup" && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge className={DIFFICULTY_COLORS[passageData.difficultyLevel]}>
              {DIFFICULTY_LABELS[passageData.difficultyLevel]}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleBackToSetup}>
              Change Difficulty
            </Button>
          </div>
        </div>
      )}

      {state === "setup" && (
        <DifficultySelector
          onStart={generateNewPassage}
          isLoading={isLoading}
        />
      )}

      {state === "practice" && passageData && (
        <div className="space-y-6">
          <ParagraphDisplay paragraph={passageData.urduParagraph} />
          <TranslationInput
            onSubmit={submitTranslation}
            isLoading={isLoading}
            sessionId={passageData.id}
          />
        </div>
      )}

      {state === "feedback" && feedbackData && passageData && (
        <div className="space-y-6">
          <ParagraphDisplay paragraph={passageData.urduParagraph} />

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Current Score
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      feedbackData.score
                    )}`}
                  >
                    {feedbackData.score.toFixed(1)}/10
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Highest Score
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      feedbackData.passageStats.highestScore
                    )}`}
                  >
                    {feedbackData.passageStats.highestScore.toFixed(1)}/10
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Attempts
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {feedbackData.passageStats.totalAttempts}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <FeedbackTable feedback={feedbackData.feedback} />

          {/* Natural Version */}
          <Card>
            <CardHeader>
              <CardTitle>Natural Translation</CardTitle>
              <CardDescription>
                An ideal natural English translation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">
                {feedbackData.naturalVersion}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={handleRetake} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake This Passage
            </Button>
            <Button onClick={handleNewPassage} variant="outline">
              Generate New Passage
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/translation-practice/history/${passageData.id}`}>
                View All Attempts
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
