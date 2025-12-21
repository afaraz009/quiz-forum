import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const passage = await prisma.translationPassage.findUnique({
      where: { id },
      include: {
        attempts: {
          orderBy: { attemptedAt: 'desc' },
        },
      },
    });

    if (!passage) {
      return NextResponse.json(
        { error: 'Passage not found' },
        { status: 404 }
      );
    }

    // Verify user owns the passage
    if (passage.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse feedback for each attempt
    const attemptsWithParsedFeedback = passage.attempts.map(attempt => ({
      ...attempt,
      aiFeedback: JSON.parse(attempt.aiFeedback),
    }));

    // Calculate stats
    const scores = passage.attempts.map(a => a.score);
    const highestScore = scores.length > 0 ? Math.max(...scores) : null;
    const recentScore = scores[0] || null;

    return NextResponse.json({
      id: passage.id,
      urduParagraph: passage.urduParagraph,
      difficultyLevel: passage.difficultyLevel,
      createdAt: passage.createdAt,
      attempts: attemptsWithParsedFeedback,
      stats: {
        totalAttempts: passage.attempts.length,
        highestScore,
        recentScore,
      },
    });
  } catch (error) {
    console.error('Error fetching passage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passage' },
      { status: 500 }
    );
  }
}
