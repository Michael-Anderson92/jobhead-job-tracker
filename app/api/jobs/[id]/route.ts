/**
 * API Route: /api/jobs/[id]
 *
 * Handles operations on individual job records
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/db';
import { CreateAndEditJobType, createAndEditJobSchema, sanitizeJobInput, JobType } from '@/utils/types';

/**
 * GET /api/jobs/[id]
 * Fetches a single job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Ensure user owns this job
    if (job.clerkId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]
 * Updates a job by ID
 *
 * Body: CreateAndEditJobType
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Update job (only if user owns it)
    const job: JobType = await prisma.job.update({
      where: {
        id: params.id,
        clerkId: userId, // Ensure user owns the job
      },
      data: sanitizedData,
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Deletes a job by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete job (only if user owns it)
    const job = await prisma.job.delete({
      where: {
        id: params.id,
        clerkId: userId, // Ensure user owns the job
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
