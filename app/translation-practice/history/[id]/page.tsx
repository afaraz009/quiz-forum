'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ParagraphDisplay } from '@/components/translation-practice/paragraph-display';
import { FeedbackTable } from '@/components/translation-practice/feedback-table';
import { ArrowLeft, TrendingUp, BookOpen, Award, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Attempt {
  id: string;
  userTranslation: string;
  aiFeedback: any[];
  naturalVersion: string;
  score: number;
  attemptedAt: string;
}

interface PassageDetail {
  id: string;
  urduParagraph: string;
  difficultyLevel: number;
  createdAt: string;
  attempts: Attempt[];
  stats: {
    totalAttempts: number;
    highestScore: number | null;
    recentScore: number | null;
  };
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  3: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function PassageDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const passageId = params.id as string;

  const [passageData, setPassageData] = useState<PassageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPassageDetail();
    }
  }, [status, router, passageId]);

  const fetchPassageDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/translation/passages/${passageId}`);
      if (res.ok) {
        const data = await res.json();
        setPassageData(data);
      } else {
        router.push('/translation-practice/history');
      }
    } catch (error) {
      console.error('Failed to fetch passage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleRetake = () => {
    // Navigate to practice page with this passage ID
    router.push(`/translation-practice?passageId=${passageId}`);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!passageData) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/translation-practice/history">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Link>
      </Button>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Passage Details</h1>
          <div className="flex items-center gap-2">
            <Badge className={DIFFICULTY_COLORS[passageData.difficultyLevel]}>
              {DIFFICULTY_LABELS[passageData.difficultyLevel]}
            </Badge>
            <Button onClick={handleRetake}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Passage
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Created on {format(new Date(passageData.createdAt), 'MMMM dd, yyyy')}
        </p>
      </div>

      {/* Urdu Paragraph */}
      <div className="mb-6">
        <ParagraphDisplay
          paragraph={passageData.urduParagraph}
          title="Urdu Paragraph"
        />
      </div>

      {/* Passage Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Total Attempts</p>
              </div>
              <p className="text-2xl font-bold">{passageData.stats.totalAttempts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(passageData.stats.highestScore || 0)}`}>
                {passageData.stats.highestScore !== null ? passageData.stats.highestScore.toFixed(1) : '-'}/10
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Recent Score</p>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(passageData.stats.recentScore || 0)}`}>
                {passageData.stats.recentScore !== null ? passageData.stats.recentScore.toFixed(1) : '-'}/10
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Your Attempts ({passageData.attempts.length})</CardTitle>
          <CardDescription>
            Review each translation attempt with detailed AI feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passageData.attempts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No attempts yet for this passage.
              </p>
              <Button onClick={handleRetake}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start First Attempt
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {passageData.attempts.map((attempt, index) => (
                <AccordionItem key={attempt.id} value={attempt.id}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">
                        Attempt #{passageData.attempts.length - index}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(attempt.attemptedAt), 'MMM dd, yyyy • HH:mm')}
                        </span>
                        <Badge variant="outline" className={getScoreColor(attempt.score)}>
                          Score: {attempt.score.toFixed(1)}/10
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      {/* User Translation */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Your Translation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-base leading-relaxed">{attempt.userTranslation}</p>
                        </CardContent>
                      </Card>

                      {/* AI Feedback */}
                      <FeedbackTable feedback={attempt.aiFeedback} />

                      {/* Natural Version */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Natural Translation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-base leading-relaxed">{attempt.naturalVersion}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
