// @ts-nocheck

'use server';

/**
 * @fileOverview An AI-powered course tutor.
 *
 * - courseTutor - A function that answers questions about a course.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  CourseTutorInput,
  CourseTutorInputSchema,
  CourseTutorOutput,
  CourseTutorOutputSchema,
} from '@/lib/types';

export async function courseTutor(input: CourseTutorInput): Promise<CourseTutorOutput> {
  return courseTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'courseTutorPrompt',
  inputSchema: CourseTutorInputSchema,
  outputSchema: CourseTutorOutputSchema,
  prompt: `You are an expert AI tutor for a corporate training platform called TalentOS. Your role is to answer student questions based *only* on the provided course content. Be helpful, clear, and concise. If the answer is not in the content, state that you cannot answer the question with the provided information.

      Course Content:
      ---
      {{{courseContent}}}
      ---

      Here is the conversation history so far. Use it to understand the context of the user's new question.
      {{#each history}}
      {{this.role}}: {{{this.text}}}
      {{/each}}

      ---
      User's New Question:
      "{{{question}}}"

      Your Answer (based on the course content and conversation history):
      `,
});

const courseTutorFlow = ai.defineFlow(
  {
    name: 'courseTutorFlow',
    inputSchema: CourseTutorInputSchema,
    outputSchema: CourseTutorOutputSchema,
    plugins: [googleAI()],
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
