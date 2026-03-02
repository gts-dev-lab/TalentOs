// @ts-nocheck
'use server';

/**
 * @fileOverview Generates personalized announcement email content.
 *
 * - generateAnnouncementEmail - A function that creates the subject and body for an announcement email.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  GenerateAnnouncementEmailInput,
  GenerateAnnouncementEmailInputSchema,
  GenerateAnnouncementEmailOutput,
  GenerateAnnouncementEmailOutputSchema,
} from '@/lib/types';

export async function generateAnnouncementEmail(
  input: GenerateAnnouncementEmailInput
): Promise<GenerateAnnouncementEmailOutput> {
  return generateAnnouncementEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'announcementEmailPrompt',
  inputSchema: GenerateAnnouncementEmailInputSchema,
  outputSchema: GenerateAnnouncementEmailOutputSchema,
  prompt: `You are an AI assistant for a corporate training platform called TalentOS. Your task is to generate a professional email based on an internal announcement.

      Recipient Name: {{{recipientName}}}
      Announcement Title: {{{announcementTitle}}}
      Announcement Content: {{{announcementContent}}}

      Based on this, generate an appropriate subject and body for an email notification. Address the recipient by their name. Keep the tone friendly but professional.
      The body should be formatted nicely for an email.
      `,
});

const generateAnnouncementEmailFlow = ai.defineFlow(
  {
    name: 'generateAnnouncementEmailFlow',
    inputSchema: GenerateAnnouncementEmailInputSchema,
    outputSchema: GenerateAnnouncementEmailOutputSchema,
    plugins: [googleAI()],
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
