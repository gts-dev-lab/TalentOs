// @ts-nocheck

'use server';

/**
 * @fileOverview An AI agent for predicting student abandonment risk.
 *
 * - predictAbandonment - A function that analyzes student data to predict their risk of abandoning their studies.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  PredictAbandonmentInput,
  PredictAbandonmentInputSchema,
  PredictAbandonmentOutput,
  PredictAbandonmentOutputSchema,
} from '@/lib/types';

export async function predictAbandonment(
  input: PredictAbandonmentInput
): Promise<PredictAbandonmentOutput> {
  return predictAbandonmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictAbandonmentPrompt',
  inputSchema: PredictAbandonmentInputSchema,
  outputSchema: PredictAbandonmentOutputSchema,
  prompt: `You are an expert student success advisor for a corporate training platform. Your task is to analyze student data and predict their risk of abandonment (Bajo, Medio, Alto).

      Analyze the following student data:
      - Student Name: {{{userName}}}
      - Last Login: {{{lastLogin}}}
      - Active Courses: {{activeCoursesCount}}
      - Completed Courses: {{completedCoursesCount}}
      - Average Progress in Active Courses: {{averageProgress}}%

      Based on this data, determine the risk level.
      - A long time since last login (e.g., > 2 weeks) increases risk.
      - Low average progress (< 40%) increases risk.
      - A high number of active courses with low progress increases risk.
      - A good number of completed courses can mitigate risk.

      Provide a brief justification for your prediction, highlighting the key indicators. Keep it concise and actionable for a training manager.
      `,
});

const predictAbandonmentFlow = ai.defineFlow(
  {
    name: 'predictAbandonmentFlow',
    inputSchema: PredictAbandonmentInputSchema,
    outputSchema: PredictAbandonmentOutputSchema,
    plugins: [googleAI()],
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
