import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface SurveyNotificationEmailProps {
  surveyTitle: string;
  surveyUrl: string;
  deadline?: Date | null;
}

export const SurveyNotificationEmail = ({
  surveyTitle,
  surveyUrl,
  deadline,
}: SurveyNotificationEmailProps) => {
  const deadlineText = deadline 
    ? `（締切: ${new Date(deadline).toLocaleDateString('ja-JP')}）`
    : '';
    
  return (
    <Html>
      <Head />
      <Preview>新しいサーベイ「{surveyTitle}」が開始されました{deadlineText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📊 新しいサーベイのお知らせ</Heading>
          
          <Text style={text}>
            新しいサーベイ「<strong>{surveyTitle}</strong>」が開始されました。
          </Text>
          
          {deadline && (
            <Text style={text}>
              締切: <strong>{new Date(deadline).toLocaleDateString('ja-JP')}</strong>
            </Text>
          )}
          
          <Section style={buttonContainer}>
            <Link
              style={button}
              href={surveyUrl}
            >
              サーベイに回答する
            </Link>
          </Section>
          
          <Text style={footer}>
            ご質問がございましたら、お気軽にお問い合わせください。
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

SurveyNotificationEmail.PreviewProps = {
  surveyTitle: '2024年第1四半期満足度調査',
  surveyUrl: 'https://example.com/surveys/1',
  deadline: new Date('2024-03-31'),
} as SurveyNotificationEmailProps;

export default SurveyNotificationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '30px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '30px',
  marginBottom: '30px',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '30px',
  textAlign: 'center' as const,
};