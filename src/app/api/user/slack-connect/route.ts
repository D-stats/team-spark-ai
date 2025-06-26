import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { createSlackClient } from '@/lib/slack/client';

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = await request.json();
    const { slackEmail } = body;

    const emailToUse = slackEmail || dbUser.email;

    // Check Slack workspace
    const slackWorkspace = await prisma.slackWorkspace.findFirst({
      where: {
        organizationId: dbUser.organizationId,
      },
    });

    if (!slackWorkspace) {
      return NextResponse.json(
        {
          error:
            'Organization Slack integration is not configured. Please contact your administrator.',
        },
        { status: 400 },
      );
    }

    // Create Slack client with workspace-specific token
    const slackClient = createSlackClient(slackWorkspace.botAccessToken);

    // SlackユーザーをメールアドレスからSlack APIで検索
    try {
      const slackUsers = await slackClient.users.lookupByEmail({
        email: emailToUse,
      });

      if (!slackUsers.ok || !slackUsers.user) {
        return NextResponse.json(
          { error: 'Slackワークスペースに該当するユーザーが見つかりません' },
          { status: 404 },
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
    } catch (slackError: unknown) {
      console.error('Slack API error:', slackError);
      return NextResponse.json(
        { error: 'An error occurred while searching for Slack user' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error connecting Slack:', error);
    return NextResponse.json({ error: 'Failed to connect Slack' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Remove Slack user ID
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        slackUserId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Slack:', error);
    return NextResponse.json({ error: 'Failed to disconnect Slack' }, { status: 500 });
  }
}
