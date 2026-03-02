import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
} from '@react-email/components';
import * as React from 'react';

interface NotificationEmailProps {
  userName: string;
  emailSubject: string;
  emailBody: string;
  buttonUrl?: string;
}

export const NotificationEmail = ({
  userName,
  emailSubject,
  emailBody,
  buttonUrl,
}: NotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>{emailSubject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>{emailSubject}</Heading>
        <Text style={paragraph}>Hola, {userName},</Text>
        <Text style={paragraph}>{emailBody}</Text>
        {buttonUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={buttonUrl}>
              Ver Detalles en la Plataforma
            </Button>
          </Section>
        )}
        <Text style={paragraph}>
          Saludos,
          <br />
          El equipo de TalentOS
        </Text>
      </Container>
    </Body>
  </Html>
);

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
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: '48px',
  textAlign: 'center' as const,
  padding: '0 40px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  padding: '12px 40px',
};

const button = {
  backgroundColor: '#2E9AFE',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
};
