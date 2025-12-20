import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { endSessionSchema } from '@/lib/validation/translation';

/**
 * POST /api/translation/session/end
 * End a translation practice session and calculate summary
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = endSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { sessionId } = validation.data;

    // Get session and verify ownership
    const translationSession = await prisma.translationSession.findUnique({
      where: { id: sessionId },
      include: { attempts: true },
    });

    if (!translationSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (translationSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!translationSession.isActive) {
      return NextResponse.json(
        { error: 'Session already ended' },
        { status: 400 }
      );
    }

    // Calculate average score
    const averageScore =
      translationSession.attempts.length > 0
        ? translationSession.attempts.reduce((sum, attempt) => sum + attempt.score, 0) /
          translationSession.attempts.length
        : 0;

    // Update session
    const updatedSession = await prisma.translationSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
        averageScore,
      },
    });

    return NextResponse.json({
      message: 'Session ended successfully',
      summary: {
        sessionId: updatedSession.id,
        difficultyLevel: updatedSession.difficultyLevel,
        totalParagraphs: updatedSession.totalParagraphs,
        averageScore: updatedSession.averageScore,
        duration: updatedSession.endedAt && updatedSession.startedAt
          ? Math.floor((updatedSession.endedAt.getTime() - updatedSession.startedAt.getTime()) / 1000 / 60)
          : 0,
      },
    });
  } catch (error) {
    console.error('End translation session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
