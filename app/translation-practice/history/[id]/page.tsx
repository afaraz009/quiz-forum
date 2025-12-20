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
import { ArrowLeft, Calendar, TrendingUp, BookOpen, Award } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Attempt {
  id: string;
  urduParagraph: string;
  userTranslation: string;
  aiFeedback: any[];
  naturalVersion: string;
  score: number;
  attemptedAt: string;
}

interface SessionDetail {
  id: string;
  difficultyLevel: number;
  startedAt: string;
  endedAt: string | null;
  averageScore: number | null;
  totalParagraphs: number;
  isActive: boolean;
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

export default function SessionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [sessionData, setSessionData] = useState<SessionDetail | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSessionDetail();
    }
  }, [status, router, sessionId]);

  const fetchSessionDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/translation/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSessionData(data.session);
        setAttempts(data.attempts);
      } else {
        router.push('/translation-practice/history');
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  const duration = sessionData.endedAt
    ? Math.floor((new Date(sessionData.endedAt).getTime() - new Date(sessionData.startedAt).getTime()) / 1000 / 60)
    : 0;

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
          <h1 className="text-3xl font-bold">Session Details</h1>
          <Badge className={DIFFICULTY_COLORS[sessionData.difficultyLevel]}>
            {DIFFICULTY_LABELS[sessionData.difficultyLevel]}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {format(new Date(sessionData.startedAt), 'MMMM dd, yyyy • HH:mm')}
        </p>
      </div>

      {/* Session Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
              </div>
              <p className="text-2xl font-bold">{duration} min</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Paragraphs</p>
              </div>
              <p className="text-2xl font-bold">{sessionData.totalParagraphs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(sessionData.averageScore || 0)}`}>
                {sessionData.averageScore?.toFixed(1) || '-'}/10
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Best Score</p>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(Math.max(...attempts.map(a => a.score)))}`}>
                {attempts.length > 0 ? Math.max(...attempts.map(a => a.score)).toFixed(1) : '-'}/10
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Attempts ({attempts.length})</CardTitle>
          <CardDescription>
            Review each translation with detailed AI feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No attempts recorded for this session.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {attempts.map((attempt, index) => (
                <AccordionItem key={attempt.id} value={attempt.id}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">
                        Attempt #{index + 1}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(attempt.attemptedAt), 'HH:mm:ss')}
                        </span>
                        <Badge variant="outline" className={getScoreColor(attempt.score)}>
                          Score: {attempt.score.toFixed(1)}/10
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      {/* Urdu Paragraph */}
                      <ParagraphDisplay
                        paragraph={attempt.urduParagraph}
                        title="Original Urdu Paragraph"
                      />

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
