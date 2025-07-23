import { NextRequest, NextResponse } from 'next/server';
import { withLogging } from '@/lib/api-logging';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import type { Job } from 'bullmq';

interface CreateJobBody {
  type: string;
  data: {
    to?: string;
    subject?: string;
    kudosId?: string;
    receiverId?: string;
    message?: string;
    [key: string]: unknown;
  };
  delay?: number;
}

// GET /api/jobs - Get job queue metrics
async function getJobs(_request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Only admins can view job metrics
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { getAllQueueMetrics } = await import('@/lib/jobs/queue');
    const metrics = await getAllQueueMetrics();

    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get job metrics' }, { status: 500 });
  }
}

// POST /api/jobs - Create a new job
async function createJob(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const body = (await request.json()) as CreateJobBody;

    const { type, data, delay } = body;

    // Validate job type
    const allowedTypes = ['send-email', 'send-kudos-notification'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
    }

    let job: Job | undefined;

    switch (type) {
      case 'send-email': {
        // Only admins can send emails
        if (dbUser.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { addJob, emailQueue } = await import('@/lib/jobs/queue');
        job = (await addJob(
          emailQueue,
          'admin-email',
          {
            to: data.to ?? '',
            subject: data.subject ?? '',
            template: 'admin-notification',
            data: {
              ...data,
              sentBy: dbUser.email,
            },
          },
          { delay },
        )) as Job;
        break;
      }

      case 'send-kudos-notification': {
        const { addJob: addNotificationJob, notificationQueue } = await import('@/lib/jobs/queue');
        job = (await addNotificationJob(
          notificationQueue,
          'kudos-notification',
          {
            kudosId: data.kudosId ?? '',
            senderId: dbUser.id,
            receiverId: data.receiverId ?? '',
            message: data.message ?? '',
          },
          { delay },
        )) as Job;
        break;
      }
    }

    return NextResponse.json(
      {
        jobId: job?.id ?? null,
        type,
        status: 'queued',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

export const GET = withLogging(getJobs, { routeName: 'jobs.list' });
export const POST = withLogging(createJob, { routeName: 'jobs.create' });
