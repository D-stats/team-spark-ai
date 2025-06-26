import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface CheckInReminderEmailProps {
  userName: string;
  checkInUrl: string;
}

export default function CheckInReminderEmail({ userName, checkInUrl }: CheckInReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>週次チェックインの時間です！</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📝 週次チェックインのリマインダー</Heading>

          <Text style={paragraph}>{userName}さん、こんにちは！</Text>

          <Text style={paragraph}>
            今週の振り返りと来週の目標を設定する時間です。
            定期的なチェックインは、あなたの成長と目標達成をサポートします。
          </Text>

          <Section style={checkInBox}>
            <Heading as="h3" style={h3}>
              チェックイン項目
            </Heading>
            <ul style={list}>
              <li>今週達成したこと</li>
              <li>気分・満足度（1-5）</li>
              <li>今週の課題・困難（任意）</li>
              <li>来週の目標</li>
            </ul>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={checkInUrl}>
              チェックインを開始
            </Button>
          </Section>

          <Text style={tipText}>
            💡 ヒント:
            チェックインは5-10分で完了できます。正直に、具体的に記入することで、より良い振り返りができます。
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            このメールは <Link href="https://teamspark.ai">TeamSpark AI</Link> から送信されました。
            <br />
            通知設定は<Link href={`${checkInUrl.replace('/checkins', '/settings')}`}>こちら</Link>
            から変更できます。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 10px',
};

const paragraph = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 10px',
  padding: '0 20px',
};

const checkInBox = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  margin: '20px',
  padding: '20px',
};

const list = {
  color: '#444',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '10px 0',
  paddingLeft: '20px',
};

const buttonContainer = {
  padding: '20px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '5px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
};

const tipText = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '20px',
  padding: '16px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  padding: '0 20px',
  textAlign: 'center' as const,
};
