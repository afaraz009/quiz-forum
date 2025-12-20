'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DifficultySelector } from '@/components/translation-practice/difficulty-selector';
import { ParagraphDisplay } from '@/components/translation-practice/paragraph-display';
import { TranslationInput } from '@/components/translation-practice/translation-input';
import { FeedbackTable } from '@/components/translation-practice/feedback-table';
import { SessionSummary } from '@/components/translation-practice/session-summary';
import { SessionStatsHeader } from '@/components/translation-practice/session-stats-header';
import { ApiKeySetupBanner } from '@/components/translation-practice/api-key-setup-banner';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedbackRow } from '@/lib/parse-gemini-feedback';

type PracticeState = 'setup' | 'practice' | 'feedback';

interface SessionData {
  id: string;
  difficultyLevel: number;
  totalParagraphs: number;
  averageScore: number | null;
}

interface FeedbackData {
  feedback: FeedbackRow[];
  naturalVersion: string;
  score: number;
}

export default function TranslationPracticePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [state, setState] = useState<PracticeState>('setup');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check auth
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check if user has API key
  useEffect(() => {
    if (status === 'authenticated') {
      checkApiKey();
    }
  }, [status]);

  const checkApiKey = async () => {
    try {
      const res = await fetch('/api/settings/gemini-key');
      const data = await res.json();
      setHasApiKey(data.hasKey);
    } catch (error) {
      console.error('Failed to check API key:', error);
    }
  };

  const startSession = async (difficultyLevel: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/translation/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficultyLevel }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to start session');
      }

      const data = await res.json();
      setSessionData({
        id: data.sessionId,
        difficultyLevel: data.difficultyLevel,
        totalParagraphs: 0,
        averageScore: null,
      });

      // Generate first paragraph
      await generateParagraph(data.sessionId, difficultyLevel);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const generateParagraph = async (sessionId: string, difficultyLevel: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/translation/generate-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, difficultyLevel }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate paragraph');
      }

      const data = await res.json();
      setCurrentParagraph(data.urduParagraph);
      setState('practice');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate paragraph');
    } finally {
      setIsLoading(false);
    }
  };

  const submitTranslation = async (translation: string) => {
    if (!sessionData) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/translation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.id,
          urduParagraph: currentParagraph,
          userTranslation: translation,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit translation');
      }

      const data = await res.json();
      setFeedbackData({
        feedback: data.feedback,
        naturalVersion: data.naturalVersion,
        score: data.score,
      });
      setSessionData({
        ...sessionData,
        totalParagraphs: data.sessionStats.totalParagraphs,
        averageScore: data.sessionStats.averageScore,
      });
      setState('feedback');
      toast.success('Translation submitted!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit translation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!sessionData) return;
    await generateParagraph(sessionData.id, sessionData.difficultyLevel);
    setFeedbackData(null);
  };

  const endSession = async () => {
    if (!sessionData) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/translation/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionData.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to end session');
      }

      const data = await res.json();
      toast.success(`Session ended! Average score: ${data.summary.averageScore?.toFixed(1) || 0}/10`);
      router.push('/translation-practice/history');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to end session');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || hasApiKey === null) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">English-Urdu Translation Practice</h1>

      {!hasApiKey && <ApiKeySetupBanner />}

      {sessionData && (
        <SessionStatsHeader
          totalParagraphs={sessionData.totalParagraphs}
          difficultyLevel={sessionData.difficultyLevel}
          averageScore={sessionData.averageScore}
        />
      )}

      {state === 'setup' && (
        <DifficultySelector onStart={startSession} isLoading={isLoading} />
      )}

      {state === 'practice' && (
        <div className="space-y-6">
          <ParagraphDisplay paragraph={currentParagraph} />
          <TranslationInput
            onSubmit={submitTranslation}
            isLoading={isLoading}
            sessionId={sessionData?.id || ''}
          />
        </div>
      )}

      {state === 'feedback' && feedbackData && (
        <div className="space-y-6">
          <ParagraphDisplay paragraph={currentParagraph} />
          <FeedbackTable feedback={feedbackData.feedback} />
          <SessionSummary
            naturalVersion={feedbackData.naturalVersion}
            score={feedbackData.score}
            onNext={handleNext}
            onEndSession={endSession}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
