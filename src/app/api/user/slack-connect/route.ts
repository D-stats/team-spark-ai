import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { createSlackClient } from '@/lib/slack/client';
import { logError } from '@/lib/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = (await request.json()) as { slackEmail?: unknown };
    const { slackEmail } = body;

    const emailToUse: string = typeof slackEmail === 'string' ? slackEmail : dbUser.email;

    // Check Slack workspace
    const slackWorkspace = await prisma.slackWorkspace.findFirst({
      where: {
        organizationId: dbUser.organizationId as string,
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

      if (!slackUsers.ok || slackUsers.user === null || slackUsers.user === undefined) {
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
      logError(slackError as Error, 'POST /api/user/slack-connect - Slack API error');
      return NextResponse.json(
        { error: 'An error occurred while searching for Slack user' },
        { status: 500 },
      );
    }
  } catch (error) {
    logError(error as Error, 'POST /api/user/slack-connect');
    return NextResponse.json({ error: 'Failed to connect Slack' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest): Promise<NextResponse> {
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
    logError(error as Error, 'DELETE /api/user/slack-connect');
    return NextResponse.json({ error: 'Failed to disconnect Slack' }, { status: 500 });
  }
}
