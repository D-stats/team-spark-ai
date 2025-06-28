import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { slackApp } from '@/lib/slack/client';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check if Slack is configured
    if (!slackApp) {
      return NextResponse.json({ error: 'Slack integration is not configured' }, { status: 503 });
    }

    const { dbUser } = await requireAuthWithOrganization();

    // Only admins can connect Slack
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can connect Slack' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const _state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=cancelled', request.url),
      );
    }

    if (!code) {
      return NextResponse.json({ error: '認証コードが見つかりません' }, { status: 400 });
    }

    // Slack OAuthトークンを取得
    const oauthResponse = await slackApp.client.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`,
    });

    if (!oauthResponse.ok || !oauthResponse.access_token || !oauthResponse.team?.id) {
      throw new Error('Slack認証に失敗しました');
    }

    const teamId = oauthResponse.team.id;
    const appId = oauthResponse.app_id || '';

    // Slackワークスペース情報を保存
    await prisma.slackWorkspace.upsert({
      where: {
        teamId: teamId,
      },
      update: {
        teamName: oauthResponse.team.name || '',
        botAccessToken: oauthResponse.access_token,
        botUserId: oauthResponse.bot_user_id || '',
        appId: appId,
        organizationId: dbUser.organizationId!,
        updatedAt: new Date(),
      },
      create: {
        teamId: teamId,
        teamName: oauthResponse.team.name || '',
        botAccessToken: oauthResponse.access_token,
        botUserId: oauthResponse.bot_user_id || '',
        appId: appId,
        organizationId: dbUser.organizationId!,
      },
    });

    // 成功時は設定ページにリダイレクト
    return NextResponse.redirect(new URL('/dashboard/settings?slack_connected=true', request.url));
  } catch (error) {
    logError(error as Error, 'GET /api/slack/callback');
    return NextResponse.redirect(new URL('/dashboard/settings?slack_error=failed', request.url));
  }
}
