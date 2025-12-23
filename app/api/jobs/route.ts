/**
 * API Route: /api/jobs
 *
 * Handles job-related HTTP requests with direct database access.
 * This route allows Client Components to fetch data via standard HTTP requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/db';
import { CreateAndEditJobType, createAndEditJobSchema, sanitizeJobInput, JobType } from '@/utils/types';
import { Prisma } from '@prisma/client';

/**
 * GET /api/jobs
 * Fetches all jobs with optional search, filter, and pagination
 *
 * Query Parameters:
 * - search: string (optional) - Search term for position/company
 * - jobStatus: string (optional) - Filter by status
 * - page: number (optional) - Page number for pagination
 * - limit: number (optional) - Items per page
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

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const jobStatus = searchParams.get('jobStatus') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    // Build where clause
    let whereClause: Prisma.JobWhereInput = {
      clerkId: userId,
    };

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { position: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (jobStatus && jobStatus !== 'all') {
      whereClause = {
        ...whereClause,
        status: jobStatus,
      };
    }

    // Fetch jobs with pagination
    const skip = (page - 1) * limit;
    const [jobs, count] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where: whereClause }),
    ]);

    return NextResponse.json({ jobs, count });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Creates a new job application
 *
 * Body: CreateAndEditJobType
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateAndEditJobType = await request.json();

    // Validate input data with Zod
    const validatedData = createAndEditJobSchema.parse(body);

    // Sanitize data (convert empty strings to null)
    const sanitizedData = sanitizeJobInput(validatedData);

    // Create job in database
    const job: JobType = await prisma.job.create({
      data: {
        ...sanitizedData,
        clerkId: userId,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
