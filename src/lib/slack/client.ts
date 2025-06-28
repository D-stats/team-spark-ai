import { WebClient } from '@slack/web-api';
import { App } from '@slack/bolt';

// Slack Web API Client factory - creates a client with workspace-specific token
export function createSlackClient(botAccessToken: string): WebClient {
  return new WebClient(botAccessToken);
}

// Slack Bolt App for handling events and commands
// For multi-workspace apps, we use OAuth installer instead of a single token
// Only initialize if Slack environment variables are configured
export const slackApp: App | null =
  process.env['SLACK_SIGNING_SECRET'] !== null &&
  process.env['SLACK_SIGNING_SECRET'] !== undefined &&
  process.env['SLACK_SIGNING_SECRET'].length > 0 &&
  process.env['SLACK_CLIENT_ID'] !== null &&
  process.env['SLACK_CLIENT_ID'] !== undefined &&
  process.env['SLACK_CLIENT_ID'].length > 0 &&
  process.env['SLACK_CLIENT_SECRET'] !== null &&
  process.env['SLACK_CLIENT_SECRET'] !== undefined &&
  process.env['SLACK_CLIENT_SECRET'].length > 0
    ? new App({
        signingSecret: process.env['SLACK_SIGNING_SECRET'],
        clientId: process.env['SLACK_CLIENT_ID'],
        clientSecret: process.env['SLACK_CLIENT_SECRET'],
        stateSecret: 'team-spark-state-secret',
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
        installerOptions: {
          // Optional: Add custom installation behavior here if needed
          directInstall: true,
        },
      })
    : null;

// Generate Slack OAuth URL
export function getSlackAuthUrl(state: string): string {
  if (
    process.env['SLACK_CLIENT_ID'] === null ||
    process.env['SLACK_CLIENT_ID'] === undefined ||
    process.env['SLACK_CLIENT_ID'].length === 0
  ) {
    throw new Error('Slack integration is not configured');
  }

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
    client_id: process.env['SLACK_CLIENT_ID'],
    scope: scopes.join(','),
    redirect_uri: `${process.env['NEXT_PUBLIC_APP_URL']}/api/slack/callback`,
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}
