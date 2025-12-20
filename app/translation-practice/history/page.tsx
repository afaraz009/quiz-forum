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
import { Eye, Calendar, Trophy, BookOpen, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Session {
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

export default function TranslationHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalParagraphs: 0,
    overallAverage: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSessions();
    }
  }, [status, router]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/translation/sessions?limit=100');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);

        // Calculate stats
        const completedSessions = data.sessions.filter((s: Session) => !s.isActive);
        const totalParagraphs = completedSessions.reduce((sum: number, s: Session) => sum + s.totalParagraphs, 0);
        const sessionsWithScores = completedSessions.filter((s: Session) => s.averageScore !== null);
        const overallAverage = sessionsWithScores.length > 0
          ? sessionsWithScores.reduce((sum: number, s: Session) => sum + (s.averageScore || 0), 0) / sessionsWithScores.length
          : 0;

        setStats({
          totalSessions: completedSessions.length,
          totalParagraphs,
          overallAverage,
        });
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDuration = (startedAt: string, endedAt: string | null) => {
    if (!endedAt) return 'In progress';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const minutes = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    return `${minutes} min`;
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
            View all your past translation practice sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/translation-practice">New Practice Session</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold">{stats.totalSessions}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paragraphs</p>
                <p className="text-3xl font-bold">{stats.totalParagraphs}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Average</p>
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

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Sessions</CardTitle>
          <CardDescription>
            Click on a session to view detailed feedback for each translation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first translation practice session to see your history here.
              </p>
              <Button asChild>
                <Link href="/translation-practice">Start Practicing</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-center">Paragraphs</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((sessionItem) => (
                  <TableRow key={sessionItem.id}>
                    <TableCell>
                      {format(new Date(sessionItem.startedAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {getDuration(sessionItem.startedAt, sessionItem.endedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={DIFFICULTY_COLORS[sessionItem.difficultyLevel]}>
                        {DIFFICULTY_LABELS[sessionItem.difficultyLevel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {sessionItem.totalParagraphs}
                    </TableCell>
                    <TableCell className="text-center">
                      {sessionItem.averageScore !== null ? (
                        <span className="font-semibold">
                          {sessionItem.averageScore.toFixed(1)}/10
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sessionItem.isActive ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30">
                          Completed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/translation-practice/history/${sessionItem.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
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
