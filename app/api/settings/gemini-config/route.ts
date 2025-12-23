import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const configSchema = z.object({
  feedbackModel: z.string().optional(),
  feedbackTemperature: z.number().min(0).max(2).optional(),
  feedbackTopP: z.number().min(0).max(1).optional(),
  feedbackTopK: z.number().int().min(1).max(100).optional(),
  feedbackMaxTokens: z.number().int().min(512).max(8192).optional(),
  generationModel: z.string().optional(),
  generationTemperature: z.number().min(0).max(2).optional(),
  generationTopP: z.number().min(0).max(1).optional(),
  generationTopK: z.number().int().min(1).max(100).optional(),
  generationMaxTokens: z.number().int().min(512).max(8192).optional(),
});

/**
 * POST /api/settings/gemini-config
 * Update Gemini model configuration without changing API key
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
    const validation = configSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      feedbackModel,
      feedbackTemperature,
      feedbackTopP,
      feedbackTopK,
      feedbackMaxTokens,
      generationModel,
      generationTemperature,
      generationTopP,
      generationTopK,
      generationMaxTokens,
    } = validation.data;

    // Prepare update data
    const updateData: any = {};

    // Feedback settings
    if (feedbackModel !== undefined) updateData.feedbackModel = feedbackModel;
    if (feedbackTemperature !== undefined) updateData.feedbackTemperature = feedbackTemperature;
    if (feedbackTopP !== undefined) updateData.feedbackTopP = feedbackTopP;
    if (feedbackTopK !== undefined) updateData.feedbackTopK = feedbackTopK;
    if (feedbackMaxTokens !== undefined) updateData.feedbackMaxTokens = feedbackMaxTokens;

    // Generation settings
    if (generationModel !== undefined) updateData.generationModel = generationModel;
    if (generationTemperature !== undefined) updateData.generationTemperature = generationTemperature;
    if (generationTopP !== undefined) updateData.generationTopP = generationTopP;
    if (generationTopK !== undefined) updateData.generationTopK = generationTopK;
    if (generationMaxTokens !== undefined) updateData.generationMaxTokens = generationMaxTokens;

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Gemini configuration saved successfully',
      success: true,
    });
  } catch (error) {
    console.error('Save Gemini config error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to save configuration',
      },
      { status: 500 }
    );
  }
}
