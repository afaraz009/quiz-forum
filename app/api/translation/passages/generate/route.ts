import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateUrduParagraph } from '@/lib/gemini-client';
import { decryptApiKey } from '@/lib/crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const generateSchema = z.object({
  difficultyLevel: z.number().int().min(1).max(3),
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
      select: {
        id: true,
        geminiApiKey: true,
        generationModel: true,
        generationTemperature: true,
        generationTopP: true,
        generationTopK: true,
        generationMaxTokens: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add it in settings.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { difficultyLevel } = generateSchema.parse(body);

    // Decrypt API key
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
    const urduParagraph = await generateUrduParagraph(apiKey, difficultyLevel, geminiConfig);

    // Create passage in database
    const passage = await prisma.translationPassage.create({
      data: {
        userId: user.id,
        urduParagraph,
        difficultyLevel,
      },
    });

    return NextResponse.json({
      passageId: passage.id,
      urduParagraph: passage.urduParagraph,
      difficultyLevel: passage.difficultyLevel,
    });
  } catch (error) {
    console.error('Error generating passage:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate passage' },
      { status: 500 }
    );
  }
}
