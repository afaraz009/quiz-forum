import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/translation/sessions
 * Get paginated list of user's translation sessions
 * Query params: page (default 1), limit (default 10), sortBy (default 'startedAt'), order (default 'desc')
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'startedAt';
    const order = searchParams.get('order') || 'desc';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Validate sortBy
    const validSortFields = ['startedAt', 'endedAt', 'difficultyLevel', 'averageScore'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      );
    }

    // Validate order
    if (order !== 'asc' && order !== 'desc') {
      return NextResponse.json(
        { error: 'Invalid sort order' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Get total count
    const totalCount = await prisma.translationSession.count({
      where: { userId: session.user.id },
    });

    // Get sessions
    const sessions = await prisma.translationSession.findMany({
      where: { userId: session.user.id },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
      select: {
        id: true,
        difficultyLevel: true,
        startedAt: true,
        endedAt: true,
        averageScore: true,
        totalParagraphs: true,
        isActive: true,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get translation sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
