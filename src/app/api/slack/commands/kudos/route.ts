import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySlackRequest } from '@/lib/slack/verify';

interface SlackCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export async function POST(request: NextRequest) {
  try {
    // Slackリクエストの検証
    const body = await request.text();
    const isValid = await verifySlackRequest(request, body);
    
    if (!isValid) {
      return NextResponse.json(
        { text: '無効なリクエストです' },
        { status: 401 }
      );
    }

    // フォームデータをパース
    const formData = new URLSearchParams(body);
    const payload: SlackCommandPayload = {
      token: formData.get('token') || '',
      team_id: formData.get('team_id') || '',
      team_domain: formData.get('team_domain') || '',
      channel_id: formData.get('channel_id') || '',
      channel_name: formData.get('channel_name') || '',
      user_id: formData.get('user_id') || '',
      user_name: formData.get('user_name') || '',
      command: formData.get('command') || '',
      text: formData.get('text') || '',
      response_url: formData.get('response_url') || '',
      trigger_id: formData.get('trigger_id') || '',
    };

    // コマンドテキストをパース（例: "@user カテゴリ メッセージ"）
    const parts = payload.text.trim().split(' ');
    if (parts.length < 3) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '使い方: `/kudos @ユーザー名 カテゴリ メッセージ`\nカテゴリ: teamwork, innovation, leadership, problem_solving, customer_focus, learning, other',
      });
    }

    const receiverMention = parts[0];
    const category = parts[1].toUpperCase();
    const message = parts.slice(2).join(' ');

    // メンションから@を削除してユーザーIDを取得
    const receiverSlackId = receiverMention.replace(/^<@|>$/g, '');

    // Slackワークスペース情報を取得
    const slackWorkspace = await prisma.slackWorkspace.findUnique({
      where: { teamId: payload.team_id },
      include: { organization: true },
    });

    if (!slackWorkspace) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'このワークスペースはTeamSpark AIに登録されていません。管理者に連絡してください。',
      });
    }

    // 送信者を検索
    const sender = await prisma.user.findFirst({
      where: {
        slackUserId: payload.user_id,
        organizationId: slackWorkspace.organizationId,
      },
    });

    if (!sender) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'あなたのアカウントが見つかりません。TeamSpark AIでSlack連携を完了してください。',
      });
    }

    // 受信者を検索
    const receiver = await prisma.user.findFirst({
      where: {
        slackUserId: receiverSlackId,
        organizationId: slackWorkspace.organizationId,
      },
    });

    if (!receiver) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '指定されたユーザーが見つかりません。',
      });
    }

    // 自分自身にKudosを送ることはできない
    if (sender.id === receiver.id) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '自分自身にKudosを送ることはできません。',
      });
    }

    // カテゴリの検証
    const validCategories = ['TEAMWORK', 'INNOVATION', 'LEADERSHIP', 'PROBLEM_SOLVING', 'CUSTOMER_FOCUS', 'LEARNING', 'OTHER'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `無効なカテゴリです。以下から選んでください: ${validCategories.map(c => c.toLowerCase()).join(', ')}`,
      });
    }

    // Kudosを作成
    const kudos = await prisma.kudos.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        message,
        category,
        isPublic: true, // Slackからのkudosは公開
      },
    });

    // 成功レスポンス
    return NextResponse.json({
      response_type: 'in_channel',
      text: `🎉 <@${payload.user_id}> さんが <@${receiverSlackId}> さんにKudosを送りました！`,
      attachments: [
        {
          color: 'good',
          fields: [
            {
              title: 'カテゴリ',
              value: getCategoryLabel(category),
              short: true,
            },
            {
              title: 'メッセージ',
              value: message,
              short: false,
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Kudos command error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'エラーが発生しました。しばらくしてからもう一度お試しください。',
    });
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    TEAMWORK: 'チームワーク',
    INNOVATION: 'イノベーション',
    LEADERSHIP: 'リーダーシップ',
    PROBLEM_SOLVING: '問題解決',
    CUSTOMER_FOCUS: '顧客志向',
    LEARNING: '学習・成長',
    OTHER: 'その他',
  };
  return labels[category] || category;
}