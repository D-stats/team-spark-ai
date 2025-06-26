# Slack Integration JIRA Issues

## Epic: TSA-SLACK - Slack Integration for TeamSpark AI

### 1. TSA-SLACK-1: Create and Configure Slack App

**Summary**: Create a new Slack App for TeamSpark AI and configure necessary permissions

**Description**:
Create a Slack App in the Slack API dashboard with proper OAuth scopes and event subscriptions for TeamSpark AI integration.

**Acceptance Criteria**:

- [ ] Slack App created at https://api.slack.com/apps
- [ ] App name: "TeamSpark AI"
- [ ] App icon and description configured
- [ ] OAuth scopes configured:
  - `channels:read`
  - `chat:write`
  - `commands`
  - `groups:read`
  - `im:read`
  - `im:write`
  - `users:read`
  - `users:read.email`
- [ ] Slash command `/kudos` configured
- [ ] OAuth redirect URL configured
- [ ] App credentials (Client ID, Client Secret, Signing Secret) documented securely

**Technical Details**:

- Bot Token Scopes required for workspace-level features
- User Token Scopes for user-specific actions
- Event subscriptions not required for initial implementation

---

### 2. TSA-SLACK-2: Setup Environment Variables and Configuration

**Summary**: Configure Slack environment variables in development and production environments

**Description**:
Set up the required environment variables for Slack integration across all environments.

**Acceptance Criteria**:

- [ ] Environment variables documented in `.env.example`:
  ```
  SLACK_CLIENT_ID=
  SLACK_CLIENT_SECRET=
  SLACK_SIGNING_SECRET=
  SLACK_BOT_TOKEN= (optional)
  ```
- [ ] GitHub Secrets configured for production
- [ ] Local development environment configured
- [ ] Configuration validation added to startup checks

**Technical Details**:

- Store credentials securely using GitHub Secrets
- Never commit actual credentials to repository
- Consider using environment-specific Slack Apps for dev/staging/prod

---

### 3. TSA-SLACK-3: Implement Slack OAuth Flow

**Summary**: Complete the OAuth 2.0 flow implementation for workspace connection

**Description**:
Ensure the OAuth flow works correctly for administrators to connect their Slack workspace to TeamSpark AI.

**Acceptance Criteria**:

- [ ] Admin can initiate Slack connection from Settings page
- [ ] OAuth flow redirects to Slack authorization page
- [ ] Successful authorization stores workspace data in database
- [ ] Error handling for cancelled/failed authorization
- [ ] Success/error messages displayed to user
- [ ] Workspace connection status displayed correctly

**Implementation Files**:

- `/src/app/api/slack/callback/route.ts` - OAuth callback handler
- `/src/app/[locale]/(dashboard)/dashboard/settings/slack/page.tsx` - Settings UI
- `/src/lib/slack/client.ts` - Slack client configuration

---

### 4. TSA-SLACK-4: Implement Kudos Slash Command

**Summary**: Enable `/kudos` slash command functionality in Slack

**Description**:
Implement the slash command handler to allow users to send kudos directly from Slack.

**Acceptance Criteria**:

- [ ] `/kudos @user category message` command works in Slack
- [ ] Command validates user exists in TeamSpark AI
- [ ] Command validates kudos category
- [ ] Kudos saved to database
- [ ] Success message posted to channel
- [ ] Error messages sent as ephemeral
- [ ] Help message for incorrect usage

**Technical Details**:

- Request signature verification for security
- User matching by Slack user ID
- Category validation against enum
- Proper error handling and user feedback

**Implementation Files**:

- `/src/app/api/slack/commands/kudos/route.ts` - Command handler
- `/src/lib/slack/verify.ts` - Request verification

---

### 5. TSA-SLACK-5: User Account Linking

**Summary**: Allow individual users to connect their Slack accounts

**Description**:
Enable users to link their TeamSpark AI account with their Slack account to receive notifications.

**Acceptance Criteria**:

- [ ] User account connection UI in user settings
- [ ] OAuth flow for individual user authorization
- [ ] Slack user ID stored in user profile
- [ ] Connection status displayed
- [ ] Ability to disconnect account
- [ ] Email-based user matching fallback

**Implementation Files**:

- `/src/app/api/user/slack-connect/route.ts` - User connection endpoint
- User settings page component (to be created)

---

### 6. TSA-SLACK-6: Kudos Notification System

**Summary**: Send Slack DM notifications when users receive kudos

**Description**:
Implement the notification system to alert users via Slack when they receive kudos.

**Acceptance Criteria**:

- [ ] DM sent when kudos received (web or Slack)
- [ ] Notification includes sender name, category, and message
- [ ] Only sent if receiver has connected Slack account
- [ ] Graceful handling if Slack API fails
- [ ] Notification formatting is clean and readable

**Technical Details**:

- Use Slack Web API to send DMs
- Queue notifications for reliability
- Handle rate limiting appropriately

**Implementation Files**:

- `/src/lib/slack/notifications.ts` - Notification functions
- Kudos creation API endpoints

---

### 7. TSA-SLACK-7: Check-in Reminder Notifications

**Summary**: Implement automated weekly check-in reminders via Slack

**Description**:
Send scheduled Slack notifications to remind users about their weekly check-ins.

**Acceptance Criteria**:

- [ ] Weekly reminders sent on configured schedule
- [ ] Only sent to users with connected Slack accounts
- [ ] Reminder includes link to check-in form
- [ ] Users can configure reminder preferences
- [ ] Bulk sending handles failures gracefully

**Technical Details**:

- Implement cron job or scheduled task
- Batch API calls for efficiency
- Track delivery status

---

### 8. TSA-SLACK-8: Survey Notifications

**Summary**: Send Slack notifications for survey creation and deadlines

**Description**:
Notify organization members when new surveys are created and remind them of approaching deadlines.

**Acceptance Criteria**:

- [ ] Notification sent when survey created
- [ ] Reminder sent before survey deadline
- [ ] Notifications include survey title and link
- [ ] Only sent to relevant organization members
- [ ] Respects user notification preferences

**Technical Details**:

- Integrate with survey creation workflow
- Schedule deadline reminders
- Handle bulk notifications efficiently

---

### 9. TSA-SLACK-9: Error Handling and Monitoring

**Summary**: Implement comprehensive error handling and monitoring for Slack integration

**Description**:
Ensure Slack integration failures don't break core functionality and are properly logged.

**Acceptance Criteria**:

- [ ] All Slack API calls have try-catch blocks
- [ ] Failures logged with appropriate detail
- [ ] User-facing features work without Slack
- [ ] Admin dashboard shows Slack integration status
- [ ] Rate limiting handled gracefully
- [ ] Webhook/API timeouts handled

**Technical Details**:

- Implement circuit breaker pattern
- Add integration health checks
- Consider implementing retry logic

---

### 10. TSA-SLACK-10: Documentation and Testing

**Summary**: Create comprehensive documentation and tests for Slack integration

**Description**:
Document the Slack integration setup process and create tests for all functionality.

**Acceptance Criteria**:

- [ ] Setup guide for administrators
- [ ] User guide for Slack features
- [ ] API documentation updated
- [ ] Unit tests for Slack utilities
- [ ] Integration tests for OAuth flow
- [ ] E2E tests for slash command
- [ ] Error scenario tests

**Deliverables**:

- `/docs/guides/slack-integration.md` - Setup guide
- `/docs/api/slack.md` - API documentation
- Test files for all Slack components

---

## Implementation Order

1. TSA-SLACK-1 & TSA-SLACK-2 (Prerequisites)
2. TSA-SLACK-3 (OAuth foundation)
3. TSA-SLACK-5 (User linking)
4. TSA-SLACK-4 (Kudos command)
5. TSA-SLACK-6 (Kudos notifications)
6. TSA-SLACK-7 & TSA-SLACK-8 (Additional notifications)
7. TSA-SLACK-9 (Error handling)
8. TSA-SLACK-10 (Documentation)

## Notes

- All tasks should be implemented with optional Slack integration in mind
- Core features must work without Slack configured
- Security is paramount - verify all requests from Slack
- Consider rate limits and implement appropriate throttling
- Test with multiple Slack workspaces if possible
