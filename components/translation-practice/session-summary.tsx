'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface SessionSummaryProps {
  naturalVersion: string;
  score: number;
  onNext: () => void;
  onEndSession: () => void;
  isLoading?: boolean;
}

export function SessionSummary({
  naturalVersion,
  score,
  onNext,
  onEndSession,
  isLoading = false,
}: SessionSummaryProps) {
  const percentage = (score / 10) * 100;
  const scoreColor =
    score >= 8 ? 'text-green-600' : score >= 6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      {/* Natural Version */}
      <Card>
        <CardHeader>
          <CardTitle>Natural Translation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{naturalVersion}</p>
        </CardContent>
      </Card>

      {/* Score */}
      <Card>
        <CardHeader>
          <CardTitle>Your Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                  className={scoreColor}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>
                  {score.toFixed(1)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">out of 10</p>
              <Progress value={percentage} className="w-32 mt-2" />
            </div>
          </div>

          <div className="flex gap-2 justify-center pt-4">
            <Button
              onClick={onNext}
              disabled={isLoading}
              size="lg"
              className="flex-1 max-w-xs"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Next Paragraph
            </Button>
            <Button
              onClick={onEndSession}
              disabled={isLoading}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
