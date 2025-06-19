import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { slackClient } from '@/lib/slack/client';

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    
    const body = await request.json();
    const { slackEmail } = body;

    const emailToUse = slackEmail || dbUser.email;

    // Slackワークスペースを確認
    const slackWorkspace = await prisma.slackWorkspace.findFirst({
      where: {
        organizationId: dbUser.organizationId,
      },
    });

    if (!slackWorkspace) {
      return NextResponse.json(
        { error: '組織のSlack連携が設定されていません。管理者に連絡してください。' },
        { status: 400 }
      );
    }

    // SlackユーザーをメールアドレスからSlack APIで検索
    try {
      const slackUsers = await slackClient.users.lookupByEmail({
        token: slackWorkspace.accessToken,
        email: emailToUse,
      });

      if (!slackUsers.ok || !slackUsers.user) {
        return NextResponse.json(
          { error: 'Slackワークスペースに該当するユーザーが見つかりません' },
          { status: 404 }
        );
      }

      // ユーザーのSlackユーザーIDを更新
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          slackUserId: slackUsers.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        slackUserId: slackUsers.user.id,
      });
    } catch (slackError: any) {
      console.error('Slack API error:', slackError);
      return NextResponse.json(
        { error: 'Slackユーザーの検索中にエラーが発生しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error connecting Slack:', error);
    return NextResponse.json(
      { error: 'Slack連携に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // SlackユーザーIDを削除
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        slackUserId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Slack:', error);
    return NextResponse.json(
      { error: 'Slack連携解除に失敗しました' },
      { status: 500 }
    );
  }
}