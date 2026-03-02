// @ts-nocheck
'use server';

import { cookies } from 'next/headers';
import { googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import type { ModelReference } from 'genkit';
import type { AIModel } from '@/lib/types';
import * as db from '@/lib/db';

/**
 * Gets the active AI model and its corresponding Genkit plugin based on the
 * administrator's configuration, which is read from cookies.
 */
export async function getActiveAIProvider(): Promise<{
  llm: ModelReference<any>;
  plugins: any[];
}> {
  const cookieStore = await cookies();
  const config = await db.getAIConfig();
  const activeModel = config.activeModel;

  let llm: ModelReference<any>;
  let plugins: any[] = [];
  let apiKey: string | undefined;

  switch (activeModel) {
    case 'OpenAI':
      apiKey = process.env.OPENAI_API_KEY || cookieStore.get('openai_api_key')?.value;
      if (!apiKey) {
        throw new Error(
          'La clave API para OpenAI no está configurada. Configúrala como OPENAI_API_KEY en .env.local'
        );
      }
      llm = openAI.model('gpt-4-turbo');
      plugins = [openAI({ apiKey })];
      break;

    case 'Claude':
    case 'HuggingFace':
    case 'Whisper':
      throw new Error(`El proveedor ${activeModel} aún no está implementado.`);

    case 'Gemini':
    default:
      apiKey = process.env.GOOGLE_API_KEY || cookieStore.get('gemini_api_key')?.value;
      if (!apiKey) {
        throw new Error(
          'La clave API para Gemini no está configurada. Configúrala como GOOGLE_API_KEY en .env.local'
        );
      }
      llm = googleAI.model('gemini-1.5-flash-latest');
      plugins = [googleAI({ apiKey })];
      break;
  }

  return { llm, plugins };
}
