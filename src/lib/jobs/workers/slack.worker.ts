import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/lib/redis';
import { log } from '@/lib/logger';
import { SyncSlackJobData, JobType } from '../queue';
import { prisma } from '@/lib/prisma';
import { WebClient } from '@slack/web-api';

export const slackWorker = new Worker<SyncSlackJobData>(
  JobType.SYNC_SLACK,
  async (job: Job<SyncSlackJobData>) => {
    const { workspaceId, syncType } = job.data;

    log.info('Processing Slack sync job', {
      jobId: job.id,
      workspaceId,
      syncType,
    });

    try {
      // Get Slack workspace configuration
      const workspace = await prisma.slackWorkspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
      }

      const slack = new WebClient(workspace.botAccessToken);

      switch (syncType) {
        case 'users':
          return await syncSlackUsers(slack, workspace.organizationId, job);
        case 'channels':
          return await syncSlackChannels(slack, workspace.organizationId, job);
        case 'messages':
          return await syncSlackMessages(slack, workspace.organizationId, job);
        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }
    } catch (error) {
      log.error('Failed to sync Slack data', {
        jobId: job.id,
        workspaceId,
        error: (error as Error).message,
      });
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60000, // Max 5 syncs per minute
    },
  },
);

interface SyncUsersResult {
  success: boolean;
  totalUsers: number;
  syncedUsers: number;
}

async function syncSlackUsers(
  slack: WebClient,
  organizationId: string,
  job: Job,
): Promise<SyncUsersResult> {
  await job.updateProgress(10);

  const result = await slack.users.list();
  const users = result.members ?? [];

  await job.updateProgress(50);

  let synced = 0;
  for (const slackUser of users) {
    if (
      slackUser.deleted !== true &&
      slackUser.is_bot !== true &&
      slackUser.id !== undefined &&
      slackUser.profile?.email !== undefined
    ) {
      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: slackUser.profile.email }, { slackUserId: slackUser.id }],
          organizationId,
        },
      });

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            slackUserId: slackUser.id,
            name: slackUser.real_name ?? slackUser.name ?? existingUser.name,
            avatarUrl: slackUser.profile.image_512 ?? slackUser.profile.image_192,
          },
        });
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            email: slackUser.profile.email,
            name: slackUser.real_name ?? slackUser.name ?? 'Unknown',
            slackUserId: slackUser.id,
            avatarUrl: slackUser.profile.image_512 ?? slackUser.profile.image_192,
            organizationId,
            role: 'MEMBER',
          },
        });
      }
      synced++;
    }
  }

  await job.updateProgress(100);

  log.info('Slack users synced', {
    organizationId,
    totalUsers: users.length,
    syncedUsers: synced,
  });

  return {
    success: true,
    totalUsers: users.length,
    syncedUsers: synced,
  };
}

interface SyncChannelsResult {
  success: boolean;
  totalChannels: number;
}

async function syncSlackChannels(
  _slack: WebClient,
  _organizationId: string,
  job: Job,
): Promise<SyncChannelsResult> {
  await job.updateProgress(10);

  const result = await _slack.conversations.list({
    types: 'public_channel,private_channel',
  });

  const channels = result.channels ?? [];

  await job.updateProgress(100);

  return {
    success: true,
    totalChannels: channels.length,
  };
}

interface SyncMessagesResult {
  success: boolean;
  message: string;
}

async function syncSlackMessages(
  _slack: WebClient,
  _organizationId: string,
  job: Job,
): Promise<SyncMessagesResult> {
  // This would be implemented based on specific requirements
  // For now, return a placeholder
  await job.updateProgress(100);

  return {
    success: true,
    message: 'Message sync not implemented',
  };
}

// Worker event handlers
slackWorker.on('completed', (job): void => {
  log.debug('Slack worker completed job', { jobId: job.id });
});

slackWorker.on('failed', (job, error): void => {
  log.error('Slack worker job failed', {
    jobId: job?.id,
    error: error.message,
  });
});

// Graceful shutdown
export async function stopSlackWorker(): Promise<void> {
  await slackWorker.close();
  log.info('Slack worker stopped');
}
