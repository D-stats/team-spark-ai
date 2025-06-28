import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/lib/redis';
import { log, logBusinessEvent } from '@/lib/logger';
import { SendEmailJobData, JobType } from '../queue';
import { Resend } from 'resend';

const resend = new Resend(process.env['RESEND_API_KEY']);

export const emailWorker = new Worker<SendEmailJobData>(
  JobType.SEND_EMAIL,
  async (job: Job<SendEmailJobData>) => {
    const { to, subject, template, data } = job.data;

    log.info('Processing email job', {
      jobId: job.id,
      to,
      subject,
      template,
    });

    try {
      // Update job progress
      await job.updateProgress(10);

      // TODO: Load and compile email template
      const html = await compileEmailTemplate(template, data as EmailTemplateData);

      await job.updateProgress(50);

      // Send email via Resend
      const result = await resend.emails.send({
        from: process.env['EMAIL_FROM'] || 'noreply@teamspark.ai',
        to,
        subject,
        html,
      });

      await job.updateProgress(100);

      log.info('Email sent successfully', {
        jobId: job.id,
        emailId: result.data?.id,
        to,
      });

      logBusinessEvent('email_sent', 'system', {
        to,
        subject,
        template,
        emailId: result.data?.id,
      });

      return {
        success: true,
        emailId: result.data?.id,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      log.error('Failed to send email', {
        jobId: job.id,
        to,
        error: (error as Error).message,
      });
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // Max 10 emails per second
    },
  },
);

// Email template compiler (placeholder)
interface EmailTemplateData {
  title?: string;
  content?: string;
  [key: string]: string | undefined;
}

async function compileEmailTemplate(_template: string, data: EmailTemplateData): Promise<string> {
  // TODO: Implement proper email template compilation
  // For now, return a simple HTML template
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title || 'TeamSpark AI'}</title>
      </head>
      <body>
        <h1>TeamSpark AI</h1>
        <p>${data.content || 'Email content'}</p>
        <hr>
        <p>© ${new Date().getFullYear()} TeamSpark AI. All rights reserved.</p>
      </body>
    </html>
  `;
}

// Worker event handlers
emailWorker.on('completed', (job) => {
  log.debug('Email worker completed job', { jobId: job.id });
});

emailWorker.on('failed', (job, error) => {
  log.error('Email worker job failed', {
    jobId: job?.id,
    error: error.message,
  });
});

emailWorker.on('error', (error) => {
  log.error('Email worker error', { error: error.message });
});

// Graceful shutdown
export async function stopEmailWorker() {
  await emailWorker.close();
  log.info('Email worker stopped');
}
