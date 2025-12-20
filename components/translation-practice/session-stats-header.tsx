'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, BarChart3, TrendingUp } from 'lucide-react';

interface SessionStatsHeaderProps {
  totalParagraphs: number;
  difficultyLevel: number;
  averageScore: number | null;
}

const DIFFICULTY_LABELS = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

export function SessionStatsHeader({
  totalParagraphs,
  difficultyLevel,
  averageScore,
}: SessionStatsHeaderProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paragraphs</p>
              <p className="text-2xl font-bold">{totalParagraphs}</p>
            </div>
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
              <p className="text-2xl font-bold">
                {DIFFICULTY_LABELS[difficultyLevel as keyof typeof DIFFICULTY_LABELS]}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">
                {averageScore !== null ? averageScore.toFixed(1) : '-'}
                <span className="text-sm text-muted-foreground">/10</span>
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
