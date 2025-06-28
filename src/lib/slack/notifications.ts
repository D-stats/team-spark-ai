import { createSlackClient } from './client';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

interface KudosNotificationData {
  receiverId: string;
  senderName: string;
  category: string;
  message: string;
}

interface CheckInReminderData {
  userId: string;
  userName: string;
}

interface SurveyNotificationData {
  organizationId: string;
  surveyTitle: string;
  deadline?: Date | null;
}

// Send Kudos reception notification
export async function sendKudosNotification(data: KudosNotificationData) {
  try {
    // Get receiver information
    const receiver = await prisma.user.findUnique({
      where: { id: data.receiverId },
      include: {
        organization: {
          include: {
            slackWorkspaces: true,
          },
        },
      },
    });

    if (!receiver?.slackUserId || !receiver.organization.slackWorkspaces[0]) {
      // Slack notification skipped: user or workspace not connected
      return;
    }

    const slackWorkspace = receiver.organization.slackWorkspaces[0];

    // Create Slack client with workspace-specific token
    const slackClient = createSlackClient(slackWorkspace.botAccessToken);

    // Category labels
    const categoryLabels: Record<string, string> = {
      TEAMWORK: 'Teamwork',
      INNOVATION: 'Innovation',
      LEADERSHIP: 'Leadership',
      PROBLEM_SOLVING: 'Problem Solving',
      CUSTOMER_FOCUS: 'Customer Focus',
      LEARNING: 'Learning & Growth',
      OTHER: 'Other',
    };

    // Send Slack message
    await slackClient.chat.postMessage({
      channel: receiver.slackUserId,
      text: `🎉 You received Kudos from ${data.senderName}!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🎉 You received Kudos!*\n${data.senderName} sent you a message of appreciation.`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Category:*\n${categoryLabels[data.category] || data.category}`,
            },
            {
              type: 'mrkdwn',
              text: `*Message:*\n${data.message}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Kudos',
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kudos`,
              style: 'primary',
            },
          ],
        },
      ],
    });
  } catch (error) {
    logError(error as Error, 'sendKudosNotification');
  }
}

// Send check-in reminder
export async function sendCheckInReminder(data: CheckInReminderData) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        organization: {
          include: {
            slackWorkspaces: true,
          },
        },
      },
    });

    if (!user?.slackUserId || !user.organization.slackWorkspaces[0]) {
      return;
    }

    const slackWorkspace = user.organization.slackWorkspaces[0];

    // Create Slack client with workspace-specific token
    const slackClient = createSlackClient(slackWorkspace.botAccessToken);

    await slackClient.chat.postMessage({
      channel: user.slackUserId,
      text: '📝 Time for your weekly check-in!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📝 週次チェックインのリマインダー*\n\nこんにちは、${data.userName}さん！\n今週の振り返りと来週の目標を設定する時間です。`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*チェックイン項目:*\n• 今週達成したこと\n• 気分・満足度（1-5）\n• 今週の課題（任意）\n• 来週の目標',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'チェックインを開始',
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkins`,
              style: 'primary',
            },
          ],
        },
      ],
    });
  } catch (error) {
    logError(error as Error, 'sendCheckInReminder');
  }
}

// サーベイ通知を送信
export async function sendSurveyNotification(data: SurveyNotificationData) {
  try {
    // 組織の全ユーザーを取得
    const users = await prisma.user.findMany({
      where: {
        organizationId: data.organizationId,
        isActive: true,
        slackUserId: { not: null },
      },
      include: {
        organization: {
          include: {
            slackWorkspaces: true,
          },
        },
      },
    });

    if (users.length === 0 || !users[0].organization.slackWorkspaces[0]) {
      return;
    }

    const slackWorkspace = users[0].organization.slackWorkspaces[0];
    const deadlineText = data.deadline
      ? `\n*締切:* ${new Date(data.deadline).toLocaleDateString('ja-JP')}`
      : '';

    // Create Slack client with workspace-specific token
    const slackClient = createSlackClient(slackWorkspace.botAccessToken);

    // 各ユーザーに通知を送信
    for (const user of users) {
      if (!user.slackUserId) continue;

      try {
        await slackClient.chat.postMessage({
          channel: user.slackUserId,
          text: `📊 新しいサーベイ「${data.surveyTitle}」が開始されました`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*📊 新しいサーベイのお知らせ*\n\n新しいサーベイ「${data.surveyTitle}」が開始されました。${deadlineText}`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'サーベイに回答',
                  },
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/surveys`,
                  style: 'primary',
                },
              ],
            },
          ],
        });
      } catch (error) {
        logError(error as Error, 'sendSurveyNotifications - user notification', {
          userId: user.id,
        });
      }
    }
  } catch (error) {
    logError(error as Error, 'sendSurveyNotifications');
  }
}
