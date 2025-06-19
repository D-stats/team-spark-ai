import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

export async function verifySlackRequest(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error('SLACK_SIGNING_SECRET is not set');
    return false;
  }

  const timestamp = request.headers.get('x-slack-request-timestamp');
  const slackSignature = request.headers.get('x-slack-signature');

  if (!timestamp || !slackSignature) {
    return false;
  }

  // タイムスタンプが5分以内であることを確認
  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 60 * 5) {
    return false;
  }

  // 署名ベースストリングを作成
  const sigBasestring = `v0:${timestamp}:${body}`;

  // HMAC SHA256ハッシュを生成
  const mySignature = 'v0=' + createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  // 署名を比較
  return mySignature === slackSignature;
}