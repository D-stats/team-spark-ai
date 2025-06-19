import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { slackApp } from '@/lib/slack/client';

export async function GET(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    
    // 管理者のみSlack連携可能
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Slack連携は管理者のみ実行できます' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?slack_error=cancelled', request.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: '認証コードが見つかりません' },
        { status: 400 }
      );
    }

    // Slack OAuthトークンを取得
    const oauthResponse = await slackApp.client.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`,
    });

    if (!oauthResponse.ok || !oauthResponse.access_token || !oauthResponse.team) {
      throw new Error('Slack認証に失敗しました');
    }

    // Slackワークスペース情報を保存
    await prisma.slackWorkspace.upsert({
      where: {
        teamId: oauthResponse.team.id,
      },
      update: {
        teamName: oauthResponse.team.name || '',
        accessToken: oauthResponse.access_token,
        botUserId: oauthResponse.bot_user_id || '',
        organizationId: dbUser.organizationId,
        updatedAt: new Date(),
      },
      create: {
        teamId: oauthResponse.team.id,
        teamName: oauthResponse.team.name || '',
        accessToken: oauthResponse.access_token,
        botUserId: oauthResponse.bot_user_id || '',
        organizationId: dbUser.organizationId,
      },
    });

    // 成功時は設定ページにリダイレクト
    return NextResponse.redirect(
      new URL('/dashboard/settings?slack_connected=true', request.url)
    );
  } catch (error) {
    console.error('Slack OAuth error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?slack_error=failed', request.url)
    );
  }
}