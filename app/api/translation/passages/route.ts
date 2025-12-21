import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const difficultyFilter = searchParams.get('difficulty');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };
    if (difficultyFilter) {
      where.difficultyLevel = parseInt(difficultyFilter);
    }

    // Get passages with attempt stats
    const passages = await prisma.translationPassage.findMany({
      where,
      include: {
        attempts: {
          select: {
            score: true,
            attemptedAt: true,
          },
          orderBy: { attemptedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.translationPassage.count({ where });

    // Format passages with stats
    const formattedPassages = passages.map(passage => {
      const scores = passage.attempts.map(a => a.score);
      const highestScore = scores.length > 0 ? Math.max(...scores) : null;
      const recentScore = scores[0] || null;
      const totalAttempts = passage.attempts.length;
      const lastAttemptedAt = passage.attempts[0]?.attemptedAt || null;

      return {
        id: passage.id,
        urduParagraph: passage.urduParagraph,
        difficultyLevel: passage.difficultyLevel,
        createdAt: passage.createdAt,
        totalAttempts,
        highestScore,
        recentScore,
        lastAttemptedAt,
      };
    });

    return NextResponse.json({
      passages: formattedPassages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching passages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passages' },
      { status: 500 }
    );
  }
}
