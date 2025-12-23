/**
 * API Route: /api/jobs/download
 *
 * Handles job export/download requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/db';

/**
 * GET /api/jobs/download
 * Fetches all jobs for download/export (no pagination)
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

    const jobs = await prisma.job.findMany({
      where: {
        clerkId: userId,
      },
      orderBy: {
        appliedDate: "desc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs for download:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs for download' },
      { status: 500 }
    );
  }
}
