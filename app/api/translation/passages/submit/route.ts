import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFeedback } from '@/lib/gemini-client';
import { parseFeedbackResponse } from '@/lib/parse-gemini-feedback';
import { decryptApiKey } from '@/lib/crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const submitSchema = z.object({
  passageId: z.string(),
  userTranslation: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
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
      select: { id: true, geminiApiKey: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { passageId, userTranslation } = submitSchema.parse(body);

    // Get the passage
    const passage = await prisma.translationPassage.findUnique({
      where: { id: passageId },
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
        { error: 'Unauthorized to submit to this passage' },
        { status: 403 }
      );
    }

    // Decrypt API key
    const apiKey = decryptApiKey(user.geminiApiKey);

    // Get AI feedback
    const feedbackText = await getFeedback(
      apiKey,
      passage.urduParagraph,
      userTranslation
    );

    // Parse feedback
    const { feedbackRows, naturalVersion, score } = parseFeedbackResponse(feedbackText);

    // Save attempt
    const attempt = await prisma.translationAttempt.create({
      data: {
        passageId: passage.id,
        userId: user.id,
        userTranslation,
        aiFeedback: JSON.stringify(feedbackRows),
        naturalVersion,
        score,
      },
    });

    // Get passage stats
    const attempts = await prisma.translationAttempt.findMany({
      where: {
        passageId: passage.id,
        userId: user.id,
      },
      select: { score: true },
      orderBy: { attemptedAt: 'desc' },
    });

    const highestScore = Math.max(...attempts.map(a => a.score));
    const recentScore = attempts[0]?.score || score;
    const totalAttempts = attempts.length;

    return NextResponse.json({
      attemptId: attempt.id,
      feedback: feedbackRows,
      naturalVersion,
      score,
      passageStats: {
        highestScore,
        recentScore,
        totalAttempts,
      },
    });
  } catch (error) {
    console.error('Error submitting translation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit translation' },
      { status: 500 }
    );
  }
}
