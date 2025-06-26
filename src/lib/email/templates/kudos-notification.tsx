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

interface KudosNotificationEmailProps {
  receiverName: string;
  senderName: string;
  category: string;
  message: string;
  kudosUrl: string;
}

const categoryLabels: Record<string, string> = {
  TEAMWORK: 'チームワーク',
  INNOVATION: 'イノベーション',
  LEADERSHIP: 'リーダーシップ',
  PROBLEM_SOLVING: '問題解決',
  CUSTOMER_FOCUS: '顧客志向',
  LEARNING: '学習・成長',
  OTHER: 'その他',
};

export default function KudosNotificationEmail({
  receiverName,
  senderName,
  category,
  message,
  kudosUrl,
}: KudosNotificationEmailProps) {
  const categoryLabel = categoryLabels[category] || category;

  return (
    <Html>
      <Head />
      <Preview>{senderName}さんからKudosを受け取りました！</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Kudosを受け取りました！</Heading>
          
          <Text style={paragraph}>
            {receiverName}さん、
          </Text>
          
          <Text style={paragraph}>
            {senderName}さんからあなたに感謝のメッセージが届いています。
          </Text>

          <Section style={kudosBox}>
            <Text style={kudosCategory}>
              <strong>カテゴリ:</strong> {categoryLabel}
            </Text>
            <Text style={kudosMessage}>
              {message}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={kudosUrl}>
              Kudosを確認する
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            このメールは <Link href="https://teamspark.ai">TeamSpark AI</Link> から送信されました。
            <br />
            通知設定は<Link href={`${kudosUrl.replace('/kudos', '/settings')}`}>こちら</Link>から変更できます。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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

const paragraph = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 10px',
  padding: '0 20px',
};

const kudosBox = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  margin: '20px',
  padding: '20px',
};

const kudosCategory = {
  color: '#6366f1',
  fontSize: '14px',
  margin: '0 0 10px',
};

const kudosMessage = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
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