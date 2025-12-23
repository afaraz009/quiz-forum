import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptApiKey } from '@/lib/crypto';
import { generateUrduParagraph } from '@/lib/gemini-client';
import { generateParagraphSchema } from '@/lib/validation/translation';

/**
 * POST /api/translation/generate-paragraph
 * Generate a new Urdu paragraph for translation practice
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
    const validation = generateParagraphSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, difficultyLevel } = validation.data;

    // Get session and verify ownership
    const translationSession = await prisma.translationSession.findUnique({
      where: { id: sessionId },
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
        { error: 'Session has ended' },
        { status: 400 }
      );
    }

    // Get user's Gemini API key and generation settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        geminiApiKey: true,
        generationModel: true,
        generationTemperature: true,
        generationTopP: true,
        generationTopK: true,
        generationMaxTokens: true,
      },
    });

    if (!user?.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const apiKey = decryptApiKey(user.geminiApiKey);

    // Prepare Gemini config for generation
    const geminiConfig = {
      model: user.generationModel || undefined,
      temperature: user.generationTemperature ?? undefined,
      topP: user.generationTopP ?? undefined,
      topK: user.generationTopK ?? undefined,
      maxOutputTokens: user.generationMaxTokens ?? undefined,
    };

    // Generate Urdu paragraph
    const urduParagraph = await generateUrduParagraph(
      apiKey,
      difficultyLevel as 1 | 2 | 3,
      geminiConfig
    );

    return NextResponse.json({
      urduParagraph,
      sessionId,
    });
  } catch (error) {
    console.error('Generate paragraph error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate paragraph',
      },
      { status: 500 }
    );
  }
}
