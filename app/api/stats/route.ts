/**
 * API Route: /api/stats
 *
 * Handles statistics-related requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/db';

/**
 * GET /api/stats
 * Fetches job application statistics grouped by status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await prisma.job.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      where: {
        clerkId: userId,
      },
    });

    const statsObject = stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Return all statuses with default 0
    const defaultStats = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      ...statsObject,
    };

    return NextResponse.json(defaultStats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
