/**
 * API Route: /api/charts
 *
 * Handles chart data requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/db';
import dayjs from 'dayjs';

/**
 * GET /api/charts
 * Fetches chart data (job applications over last 6 months)
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

    const sixMonthsAgo = dayjs().subtract(6, "month").toDate();

    const jobs = await prisma.job.findMany({
      where: {
        clerkId: userId,
        appliedDate: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: {
        appliedDate: "asc",
      },
    });

    const applicationsPerMonth = jobs.reduce((acc, job) => {
      const date = dayjs(job.appliedDate).format("MMM YY");
      const existingEntry = acc.find((entry) => entry.date === date);

      if (existingEntry) {
        existingEntry.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }

      return acc;
    }, [] as Array<{ date: string; count: number }>);

    return NextResponse.json(applicationsPerMonth);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
