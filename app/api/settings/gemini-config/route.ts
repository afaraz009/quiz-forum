import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const configSchema = z.object({
  geminiModel: z.string().optional(),
  geminiTemperature: z.number().min(0).max(2).optional(),
  geminiTopP: z.number().min(0).max(1).optional(),
  geminiTopK: z.number().int().min(1).max(100).optional(),
  geminiMaxTokens: z.number().int().min(512).max(8192).optional(),
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

    const { geminiModel, geminiTemperature, geminiTopP, geminiTopK, geminiMaxTokens } = validation.data;

    // Prepare update data
    const updateData: any = {};
    if (geminiModel !== undefined) updateData.geminiModel = geminiModel;
    if (geminiTemperature !== undefined) updateData.geminiTemperature = geminiTemperature;
    if (geminiTopP !== undefined) updateData.geminiTopP = geminiTopP;
    if (geminiTopK !== undefined) updateData.geminiTopK = geminiTopK;
    if (geminiMaxTokens !== undefined) updateData.geminiMaxTokens = geminiMaxTokens;

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
