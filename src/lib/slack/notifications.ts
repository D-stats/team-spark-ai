import { slackClient } from './client';
import { prisma } from '@/lib/prisma';

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

// Kudos受信通知を送信
export async function sendKudosNotification(data: KudosNotificationData) {
  try {
    // 受信者の情報を取得
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
      console.log('Slack notification skipped: user or workspace not connected');
      return;
    }

    const slackWorkspace = receiver.organization.slackWorkspaces[0];
    
    // カテゴリの日本語ラベル
    const categoryLabels: Record<string, string> = {
      TEAMWORK: 'チームワーク',
      INNOVATION: 'イノベーション', 
      LEADERSHIP: 'リーダーシップ',
      PROBLEM_SOLVING: '問題解決',
      CUSTOMER_FOCUS: '顧客志向',
      LEARNING: '学習・成長',
      OTHER: 'その他',
    };

    // Slackメッセージを送信
    await slackClient.chat.postMessage({
      token: slackWorkspace.botAccessToken,
      channel: receiver.slackUserId,
      text: `🎉 ${data.senderName}さんからKudosを受け取りました！`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🎉 Kudosを受け取りました！*\n${data.senderName}さんからあなたに感謝のメッセージが届いています。`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*カテゴリ:*\n${categoryLabels[data.category] || data.category}`,
            },
            {
              type: 'mrkdwn',
              text: `*メッセージ:*\n${data.message}`,
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
                text: 'Kudosを確認',
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kudos`,
              style: 'primary',
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Failed to send Kudos notification:', error);
  }
}

// チェックインリマインダーを送信
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

    await slackClient.chat.postMessage({
      token: slackWorkspace.botAccessToken,
      channel: user.slackUserId,
      text: '📝 週次チェックインの時間です！',
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
    console.error('Failed to send check-in reminder:', error);
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

    // 各ユーザーに通知を送信
    for (const user of users) {
      if (!user.slackUserId) continue;

      try {
        await slackClient.chat.postMessage({
          token: slackWorkspace.botAccessToken,
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
        console.error(`Failed to send survey notification to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to send survey notifications:', error);
  }
}