import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/translation/sessions/[id]
 * Get a specific translation session with all attempts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get session with attempts
    const translationSession = await prisma.translationSession.findUnique({
      where: { id },
      include: {
        attempts: {
          orderBy: { attemptedAt: 'asc' },
        },
      },
    });

    if (!translationSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (translationSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse feedback JSON for each attempt
    const attemptsWithParsedFeedback = translationSession.attempts.map((attempt) => ({
      ...attempt,
      aiFeedback: JSON.parse(attempt.aiFeedback),
    }));

    return NextResponse.json({
      session: {
        id: translationSession.id,
        difficultyLevel: translationSession.difficultyLevel,
        startedAt: translationSession.startedAt,
        endedAt: translationSession.endedAt,
        averageScore: translationSession.averageScore,
        totalParagraphs: translationSession.totalParagraphs,
        isActive: translationSession.isActive,
      },
      attempts: attemptsWithParsedFeedback,
    });
  } catch (error) {
    console.error('Get translation session detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
