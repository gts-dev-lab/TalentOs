// @ts-nocheck

'use server';

/**
 * @fileOverview An AI agent for automatically generating a full course structure from a topic.
 *
 * - generateCourseFromTopic - A function that generates a course structure.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  GenerateCourseFromTopicInput,
  GenerateCourseFromTopicInputSchema,
  GenerateCourseFromTopicOutput,
  GenerateCourseFromTopicOutputSchema,
} from '@/lib/types';

export async function generateCourseFromTopic(
  input: GenerateCourseFromTopicInput
): Promise<GenerateCourseFromTopicOutput> {
  return generateCourseFromTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCourseFromTopicPrompt',
  inputSchema: GenerateCourseFromTopicInputSchema,
  outputSchema: GenerateCourseFromTopicOutputSchema,
  prompt: `You are an expert instructional designer for a corporate training platform specializing in emergency services (paramedics, dispatchers, etc.). Your task is to generate a complete, well-structured course outline based on a given topic. The target audience is Spanish-speaking emergency personnel.

      Topic: "{{{input}}}"

      Based on this topic, generate a full course structure. The content should be professional, practical, and tailored to the emergency services field in Spain.

      Provide the following information:
      - A professional and clear title.
      - A short, engaging description (1-2 sentences).
      - A longer, more detailed description explaining the course goals and content.
      - A plausible name for a qualified instructor (e.g., Dr., professional title).
      - The total estimated duration for the course (e.g., "16 horas").
      - The most appropriate modality (Online, Presencial, Mixta).
      - A list of 3 to 7 detailed modules. Each module must include a title, an estimated duration, and a summary of its content.

      Ensure the output is in Spanish and conforms strictly to the provided JSON schema.
      `,
});

const generateCourseFromTopicFlow = ai.defineFlow(
  {
    name: 'generateCourseFromTopicFlow',
    inputSchema: GenerateCourseFromTopicInputSchema,
    outputSchema: GenerateCourseFromTopicOutputSchema,
    plugins: [googleAI()],
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
