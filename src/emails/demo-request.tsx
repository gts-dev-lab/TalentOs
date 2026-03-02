import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import * as React from 'react';

interface DemoRequestEmailProps {
  name: string;
  company: string;
  email: string;
  message?: string;
}

export const DemoRequestEmail = ({ name, company, email, message }: DemoRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>Nueva Solicitud de Demo de {company}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Nueva Solicitud de Demo</Heading>
        <Text style={paragraph}>
          Has recibido una nueva solicitud de demo a través de la web de TalentOS.
        </Text>
        <Text style={field}>
          <strong>Nombre:</strong> {name}
        </Text>
        <Text style={field}>
          <strong>Empresa:</strong> {company}
        </Text>
        <Text style={field}>
          <strong>Email de Contacto:</strong> {email}
        </Text>
        <Text style={field}>
          <strong>Mensaje:</strong>
        </Text>
        <Text style={messageBox}>{message || 'No se proporcionó un mensaje adicional.'}</Text>
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
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '48px',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const field = {
  ...paragraph,
  color: '#525f7f',
};

const messageBox = {
  ...field,
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
  padding: '15px',
  margin: '0 40px',
};
