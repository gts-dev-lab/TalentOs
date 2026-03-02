// @ts-nocheck

'use server';

import { cookies } from 'next/headers';
import type { User } from './types';
import * as db from './db';
import { Resend } from 'resend';
import twilio from 'twilio';
import * as React from 'react';
import { NotificationEmail } from '@/emails/notification';

function getConfigValue(cookieName: string, envVarName: string): string | undefined {
  // Priorizar env vars sobre cookies (cookies deprecated, solo para compatibilidad temporal)
  const envValue = process.env[envVarName];
  if (envValue) return envValue;
  const cookieValue = cookies().get(cookieName)?.value;
  if (cookieValue) {
    // Log warning si se usa cookie (deprecated)
    console.warn(
      `[DEPRECATED] Using cookie "${cookieName}" for ${envVarName}. Please migrate to environment variable.`
    );
  }
  return cookieValue;
}

/**
 * Sends an email using Resend.
 * @param options - Email options.
 * @param options.to - Optional recipient email.
 * @param options.subject - The email subject.
 * @param options.react - The React component for the email body.
 * @param options.replyTo - Optional email address to set as the reply-to header.
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = 'onboarding@resend.dev';

  if (!apiKey) {
    console.warn(`--- [EMAIL SIMULATION] ---`);
    console.warn('Resend API Key not set. Simulating email send.');
    console.log(`To: ${to}`);
    console.log(`From: ${fromEmail}`);
    console.log(`Reply-To: ${replyTo || 'N/A'}`);
    console.log(`Subject: ${subject}`);
    console.log('---------------------------');
    await db.logSystemEvent('WARN', 'Email Simulation: Resend API Key not set.');
    return;
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      react: react,
      reply_to: replyTo,
    });
    await db.logSystemEvent('INFO', `Email sent successfully to ${to}`, { subject });
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    await db.logSystemEvent('ERROR', `Failed to send email to ${to}`, {
      error: (error as Error).message,
    });
    throw error;
  }
}

// --- Email Service ---
export async function sendEmailNotification(
  user: User,
  subject: string,
  body: string,
  relatedUrl?: string
): Promise<void> {
  await sendEmail({
    to: user.email,
    subject,
    react: (
      <NotificationEmail
        userName={user.name}
        emailSubject={subject}
        emailBody={body}
        buttonUrl={relatedUrl}
      />
    ),
  });
}

// --- WhatsApp Service (Twilio) ---
export async function sendWhatsAppNotification(user: User, message: string): Promise<void> {
  const accountSid = getConfigValue('twilio_account_sid', 'TWILIO_ACCOUNT_SID');
  const authToken = getConfigValue('twilio_auth_token', 'TWILIO_AUTH_TOKEN');
  const fromPhone = getConfigValue('twilio_whatsapp_from', 'TWILIO_WHATSAPP_FROM');
  const toPhone = user.phone;

  if (!accountSid || !authToken || !fromPhone || !toPhone) {
    console.warn(`--- [WHATSAPP SIMULATION to ${toPhone || 'N/A'}] ---`);
    console.warn(
      'Twilio credentials, From Phone, or User Phone not set. Simulating WhatsApp send.'
    );
    console.log(`Message: ${message}`);
    console.log('------------------------------------');
    await db.logSystemEvent(
      'WARN',
      `WhatsApp Simulation: Twilio credentials not fully set for user ${user.id}`
    );
    return;
  }

  const client = twilio(accountSid, authToken);

  try {
    await client.messages.create({
      from: `whatsapp:${fromPhone}`,
      to: `whatsapp:${toPhone}`,
      body: message,
    });
    await db.logSystemEvent('INFO', `WhatsApp message sent to ${user.name}`);
  } catch (error) {
    console.error('Error sending WhatsApp message via Twilio:', error);
    await db.logSystemEvent('ERROR', `Failed to send WhatsApp message to ${user.name}`, {
      error: (error as Error).message,
    });
  }
}

// --- Push Notifications (Web Notifications API) ---
// Nota: Las notificaciones push ahora usan la API nativa del navegador
// No se requiere Firebase. Las notificaciones se envían directamente desde el cliente.

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<void> {
  // Las notificaciones push ahora se manejan directamente en el cliente usando la Web Notifications API
  // Esta función se mantiene para compatibilidad pero no hace nada en el servidor
  // El cliente debe usar la API nativa del navegador para mostrar notificaciones

  console.log(`[PUSH NOTIFICATION] Simulated push notification for user ${userId}:`);
  console.log(`  Title: ${title}`);
  console.log(`  Body: ${body}`);
  console.log(`  URL: ${url}`);

  await db.logSystemEvent('INFO', `Push notification requested for user ${userId}`, {
    title,
    body,
    url,
  });

  // Nota: Para implementar notificaciones push reales sin Firebase, se necesitaría:
  // 1. Un service worker con Web Push API
  // 2. Un servidor de push (ej: VAPID keys con un servidor propio)
  // 3. Suscripción del usuario a un endpoint de push
  // Por ahora, las notificaciones se muestran solo cuando la app está abierta usando la Web Notifications API
}
