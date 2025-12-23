import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptApiKey } from '@/lib/crypto';

/**
 * GET /api/settings/gemini-models
 * Fetch available Gemini models from the API
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's API key
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { geminiApiKey: true },
    });

    if (!user?.geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const apiKey = decryptApiKey(user.geminiApiKey);

    // Fetch available models from Google AI API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter for generative models and format the response
    const generativeModels = data.models
      .filter((model: any) =>
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map((model: any) => ({
        name: model.name.replace('models/', ''),
        displayName: model.displayName,
        description: model.description,
        inputTokenLimit: model.inputTokenLimit,
        outputTokenLimit: model.outputTokenLimit,
      }))
      // Sort by name to have consistent ordering
      .sort((a: any, b: any) => {
        // Prioritize 2.0 models, then 1.5, then others
        const getVersion = (name: string) => {
          if (name.includes('2.0') || name.includes('2-')) return 3;
          if (name.includes('1.5') || name.includes('1-5')) return 2;
          return 1;
        };
        const versionDiff = getVersion(b.name) - getVersion(a.name);
        if (versionDiff !== 0) return versionDiff;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      models: generativeModels,
    });
  } catch (error) {
    console.error('Fetch Gemini models error:', error);

    // Return a fallback list of known models if the API call fails
    const fallbackModels = [
      {
        name: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash (Experimental)',
        description: 'Latest experimental flash model',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
      },
      {
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and versatile multimodal model',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
      },
      {
        name: 'gemini-1.5-flash-8b',
        displayName: 'Gemini 1.5 Flash-8B',
        description: 'Smaller, faster flash model',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
      },
      {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Most capable model for complex tasks',
        inputTokenLimit: 2000000,
        outputTokenLimit: 8192,
      },
      {
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        description: 'Previous generation model',
        inputTokenLimit: 30720,
        outputTokenLimit: 2048,
      },
    ];

    return NextResponse.json({
      models: fallbackModels,
      usedFallback: true,
      error: error instanceof Error ? error.message : 'Failed to fetch models',
    });
  }
}
