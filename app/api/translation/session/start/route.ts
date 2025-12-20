import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startSessionSchema } from '@/lib/validation/translation';

/**
 * POST /api/translation/session/start
 * Create a new translation practice session
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
    const validation = startSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { difficultyLevel } = validation.data;

    // Check if user has a Gemini API key
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { geminiApiKey: true },
    });

    if (!user?.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add your API key in settings.' },
        { status: 400 }
      );
    }

    // Create a new translation session
    const translationSession = await prisma.translationSession.create({
      data: {
        userId: session.user.id,
        difficultyLevel,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: 'Translation session started',
      sessionId: translationSession.id,
      difficultyLevel: translationSession.difficultyLevel,
    });
  } catch (error) {
    console.error('Start translation session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
