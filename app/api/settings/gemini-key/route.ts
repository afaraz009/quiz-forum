import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { testApiKey } from '@/lib/gemini-client';
import { saveApiKeySchema } from '@/lib/validation/translation';

/**
 * GET /api/settings/gemini-key
 * Check if user has a Gemini API key configured
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { geminiApiKey: true },
    });

    return NextResponse.json({
      hasKey: !!user?.geminiApiKey,
    });
  } catch (error) {
    console.error('Get Gemini key status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/gemini-key
 * Save and validate a Gemini API key
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
    const validation = saveApiKeySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid API key format', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { apiKey } = validation.data;

    // Test the API key with Gemini
    const isValid = await testApiKey(apiKey);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Gemini API key. Please check and try again.' },
        { status: 400 }
      );
    }

    // Encrypt and save the API key
    const encryptedKey = encryptApiKey(apiKey);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { geminiApiKey: encryptedKey },
    });

    return NextResponse.json({
      message: 'Gemini API key saved successfully',
      success: true,
    });
  } catch (error) {
    console.error('Save Gemini key error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to save API key',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/gemini-key
 * Remove the user's Gemini API key
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { geminiApiKey: null },
    });

    return NextResponse.json({
      message: 'Gemini API key removed successfully',
      success: true,
    });
  } catch (error) {
    console.error('Delete Gemini key error:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }
}
