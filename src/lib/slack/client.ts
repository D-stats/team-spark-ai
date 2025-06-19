import { WebClient } from '@slack/web-api';
import { App } from '@slack/bolt';

// Slack Web API Client
export const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// Slack Bolt App for handling events and commands
export const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: 'startup-hr-state-secret',
  scopes: [
    'channels:read',
    'chat:write',
    'commands',
    'groups:read',
    'im:read',
    'im:write',
    'users:read',
    'users:read.email',
  ],
});

// Slack OAuth用のURL生成
export function getSlackAuthUrl(state: string) {
  const scopes = [
    'channels:read',
    'chat:write',
    'commands',
    'groups:read',
    'im:read',
    'im:write',
    'users:read',
    'users:read.email',
  ];

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: scopes.join(','),
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`,
    state,
  });
  
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}