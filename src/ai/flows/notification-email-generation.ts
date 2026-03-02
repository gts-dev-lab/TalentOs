// @ts-nocheck

'use server';

/**
 * @fileOverview Generates personalized notification email content.
 *
 * - generateNotificationEmail - A function that creates the subject and body for a notification email.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  GenerateNotificationEmailInput,
  GenerateNotificationEmailInputSchema,
  GenerateNotificationEmailOutput,
  GenerateNotificationEmailOutputSchema,
} from '@/lib/types';

export async function generateNotificationEmail(
  input: GenerateNotificationEmailInput
): Promise<GenerateNotificationEmailOutput> {
  return generateNotificationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'notificationEmailPrompt',
  inputSchema: GenerateNotificationEmailInputSchema,
  outputSchema: GenerateNotificationEmailOutputSchema,
  prompt: `You are an AI assistant for a corporate training platform called TalentOS. Your task is to generate a personalized and professional email notification.

      Recipient Name: {{{recipientName}}}
      Course Name: {{{courseName}}}
      Notification Type: {{{notificationType}}}

      Based on the notification type, generate an appropriate subject and body for the email. Address the recipient by their name. Keep the tone friendly but professional.

      - If the type is 'course_reminder', remind them to continue their progress.
      - If the type is 'new_course_available', announce the new course and encourage them to enroll.
      - If the type is 'feedback_ready', let them know their feedback on a recent test is available.
      `,
});

const generateNotificationEmailFlow = ai.defineFlow(
  {
    name: 'generateNotificationEmailFlow',
    inputSchema: GenerateNotificationEmailInputSchema,
    outputSchema: GenerateNotificationEmailOutputSchema,
    plugins: [googleAI()],
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
