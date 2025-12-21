'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, BookOpen, TrendingUp, Trophy, Languages } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Passage {
  id: string;
  urduParagraph: string;
  difficultyLevel: number;
  createdAt: string;
  totalAttempts: number;
  highestScore: number | null;
  recentScore: number | null;
  lastAttemptedAt: string | null;
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

export default function TranslationHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [stats, setStats] = useState({
    totalPassages: 0,
    totalAttempts: 0,
    overallAverage: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPassages();
    }
  }, [status, router, difficultyFilter]);

  const fetchPassages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (difficultyFilter) {
        params.append('difficulty', difficultyFilter);
      }

      const res = await fetch(`/api/translation/passages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPassages(data.passages);

        // Calculate stats
        const totalAttempts = data.passages.reduce((sum: number, p: Passage) => sum + p.totalAttempts, 0);
        const passagesWithScores = data.passages.filter((p: Passage) => p.highestScore !== null);
        const overallAverage = passagesWithScores.length > 0
          ? passagesWithScores.reduce((sum: number, p: Passage) => sum + (p.highestScore || 0), 0) / passagesWithScores.length
          : 0;

        setStats({
          totalPassages: data.passages.length,
          totalAttempts,
          overallAverage,
        });
      }
    } catch (error) {
      console.error('Failed to fetch passages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateUrdu = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Translation Practice History</h1>
          <p className="text-muted-foreground mt-2">
            View all your translation passages and practice attempts
          </p>
        </div>
        <Button asChild>
          <Link href="/translation-practice">New Practice</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Passages</p>
                <p className="text-3xl font-bold">{stats.totalPassages}</p>
              </div>
              <Languages className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Attempts</p>
                <p className="text-3xl font-bold">{stats.totalAttempts}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Highest Score</p>
                <p className="text-3xl font-bold">
                  {stats.overallAverage.toFixed(1)}
                  <span className="text-lg text-muted-foreground">/10</span>
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={difficultyFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('')}
        >
          All
        </Button>
        <Button
          variant={difficultyFilter === '1' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('1')}
        >
          Beginner
        </Button>
        <Button
          variant={difficultyFilter === '2' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('2')}
        >
          Intermediate
        </Button>
        <Button
          variant={difficultyFilter === '3' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('3')}
        >
          Advanced
        </Button>
      </div>

      {/* Passages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Passages</CardTitle>
          <CardDescription>
            Click on a passage to view all your attempts and retake it
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passages.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No passages yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first translation practice to see your history here.
              </p>
              <Button asChild>
                <Link href="/translation-practice">Start Practicing</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passage Preview</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-center">Attempts</TableHead>
                  <TableHead className="text-center">Highest Score</TableHead>
                  <TableHead className="text-center">Recent Score</TableHead>
                  <TableHead>Last Attempted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passages.map((passage) => (
                  <TableRow key={passage.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-noto-nastaliq text-right" dir="rtl">
                        {truncateUrdu(passage.urduParagraph)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={DIFFICULTY_COLORS[passage.difficultyLevel]}>
                        {DIFFICULTY_LABELS[passage.difficultyLevel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {passage.totalAttempts}
                    </TableCell>
                    <TableCell className="text-center">
                      {passage.highestScore !== null ? (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {passage.highestScore.toFixed(1)}/10
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {passage.recentScore !== null ? (
                        <span className="font-semibold">
                          {passage.recentScore.toFixed(1)}/10
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {passage.lastAttemptedAt ? (
                        format(new Date(passage.lastAttemptedAt), 'MMM dd, yyyy')
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/translation-practice/history/${passage.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
