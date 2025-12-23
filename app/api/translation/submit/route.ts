import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptApiKey } from '@/lib/crypto';
import { getFeedback } from '@/lib/gemini-client';
import { parseFeedbackResponse } from '@/lib/parse-gemini-feedback';
import { submitTranslationSchema } from '@/lib/validation/translation';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/translation/submit
 * Submit a translation for AI feedback
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

    // Check rate limit (30 requests per hour)
    const rateLimit = checkRateLimit(session.user.id, 30);
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: resetDate.toISOString(),
          remaining: rateLimit.remaining,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': resetDate.toISOString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = submitTranslationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, urduParagraph, userTranslation } = validation.data;

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

    // Get user's Gemini API key and settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        geminiApiKey: true,
        geminiModel: true,
        geminiTemperature: true,
        geminiTopP: true,
        geminiTopK: true,
        geminiMaxTokens: true,
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

    // Prepare Gemini config
    const geminiConfig = {
      model: user.geminiModel || undefined,
      temperature: user.geminiTemperature ?? undefined,
      topP: user.geminiTopP ?? undefined,
      topK: user.geminiTopK ?? undefined,
      maxOutputTokens: user.geminiMaxTokens ?? undefined,
    };

    // Get AI feedback
    const feedbackResponse = await getFeedback(apiKey, urduParagraph, userTranslation, geminiConfig);

    // Parse the feedback
    const parsedFeedback = parseFeedbackResponse(feedbackResponse);

    // Create translation attempt record
    const attempt = await prisma.translationAttempt.create({
      data: {
        sessionId,
        urduParagraph,
        userTranslation,
        aiFeedback: JSON.stringify(parsedFeedback.feedbackRows),
        naturalVersion: parsedFeedback.naturalVersion,
        score: parsedFeedback.score,
      },
    });

    // Update session stats
    const updatedSession = await prisma.translationSession.update({
      where: { id: sessionId },
      data: {
        totalParagraphs: { increment: 1 },
      },
      include: { attempts: true },
    });

    // Calculate new average score
    const averageScore =
      updatedSession.attempts.reduce((sum, a) => sum + a.score, 0) /
      updatedSession.attempts.length;

    // Update average score
    await prisma.translationSession.update({
      where: { id: sessionId },
      data: { averageScore },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      feedback: parsedFeedback.feedbackRows,
      naturalVersion: parsedFeedback.naturalVersion,
      score: parsedFeedback.score,
      sessionStats: {
        totalParagraphs: updatedSession.totalParagraphs,
        averageScore,
      },
    });
  } catch (error) {
    console.error('Submit translation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit translation',
      },
      { status: 500 }
    );
  }
}
