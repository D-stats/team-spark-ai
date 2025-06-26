import { Resend } from 'resend';
import KudosNotificationEmail from './templates/kudos-notification';
import CheckInReminderEmail from './templates/checkin-reminder';
import SurveyNotificationEmail from './templates/survey-notification';
import { ReactElement } from 'react';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
}

async function sendEmail({ to, subject, react }: SendEmailOptions) {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY is missing');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'TeamSpark AI <noreply@teamspark.ai>',
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

interface KudosEmailData {
  receiverEmail: string;
  receiverName: string;
  senderName: string;
  category: string;
  message: string;
}

export async function sendKudosEmail(data: KudosEmailData) {
  const kudosUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kudos`;

  return sendEmail({
    to: data.receiverEmail,
    subject: `${data.senderName}さんからKudosを受け取りました！`,
    react: KudosNotificationEmail({
      receiverName: data.receiverName,
      senderName: data.senderName,
      category: data.category,
      message: data.message,
      kudosUrl,
    }),
  });
}

interface CheckInReminderData {
  userEmail: string;
  userName: string;
}

export async function sendCheckInReminderEmail(data: CheckInReminderData) {
  const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkins`;

  return sendEmail({
    to: data.userEmail,
    subject: '週次チェックインのリマインダー',
    react: CheckInReminderEmail({
      userName: data.userName,
      checkInUrl,
    }),
  });
}

interface SurveyNotificationData {
  userEmails: string[];
  surveyTitle: string;
  deadline?: Date | null;
}

export async function sendSurveyNotificationEmail(data: SurveyNotificationData) {
  const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/surveys`;
  const deadlineText = data.deadline
    ? `（締切: ${new Date(data.deadline).toLocaleDateString('ja-JP')}）`
    : '';

  return sendEmail({
    to: data.userEmails,
    subject: `新しいサーベイ「${data.surveyTitle}」が開始されました${deadlineText}`,
    react: SurveyNotificationEmail({
      surveyTitle: data.surveyTitle,
      surveyUrl,
      deadline: data.deadline,
    }),
  });
}
