// @ts-nocheck

'use server';

/**
 * @fileOverview Provides personalized course recommendations based on a user's comprehensive profile.
 *
 * - personalizedCourseRecommendations - a function that returns personalized course recommendations.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
  PersonalizedCourseRecommendationsInput,
  PersonalizedCourseRecommendationsInputSchema,
  PersonalizedCourseRecommendationsOutput,
  PersonalizedCourseRecommendationsOutputSchema,
} from '@/lib/types';

export async function personalizedCourseRecommendations(
  input: PersonalizedCourseRecommendationsInput
): Promise<PersonalizedCourseRecommendationsOutput> {
  return personalizedCourseRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'courseSuggestionPrompt',
    inputSchema: PersonalizedCourseRecommendationsInputSchema,
    outputSchema: PersonalizedCourseRecommendationsOutputSchema,
    prompt: `You are an expert career advisor for an emergency services training platform. Your task is to recommend relevant internal courses to a user based on their profile.

      Analyze the user's data:
      - Role: {{{userRole}}}
      - Internal Courses Already Taken: {{#if enrolledCourseTitles}}"{{#each enrolledCourseTitles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}"{{else}}None{{/if}}
      - External Training Completed: {{#if externalTrainingTitles}}"{{#each externalTrainingTitles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}"{{else}}None{{/if}}

      Here is the complete catalog of available internal courses:
      {{#each allAvailableCourseTitles}}
      - "{{this}}"
      {{/each}}

      Based on all this information, suggest up to 3 courses from the catalog that would be most beneficial for the user.
      - Do NOT suggest courses the user is already enrolled in.
      - Prioritize suggestions that complement or build upon their existing external training (e.g., if they have an external 'cardiology' course, suggest an internal 'Advanced EKG' course).
      - If there are no clear links, suggest courses that are highly relevant to their role.
      - For each suggestion, provide a short, encouraging reason in Spanish.

      Return the suggestions in the specified JSON format.`
});

const personalizedCourseRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedCourseRecommendationsFlow',
    inputSchema: PersonalizedCourseRecommendationsInputSchema,
    outputSchema: PersonalizedCourseRecommendationsOutputSchema,
    plugins: [googleAI()],
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
