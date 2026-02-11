
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { AIConfig, AIModel } from '@/lib/types';
import * as db from '@/lib/db';
import { sendPushNotification } from '@/lib/notification-service.tsx';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'strict' as const,
  maxAge: 31536000, // 1 year
};

export async function saveApiKeysAction(prevState: any, formData: FormData) {
  await db.logSystemEvent('WARN', 'API keys save attempted via UI - deprecated. Use environment variables instead.');
  revalidatePath('/dashboard/settings');
  return { 
    success: false, 
    message: 'Las API keys ahora deben configurarse como variables de entorno en .env.local. Consulta la documentación de despliegue.' 
  };
}

export async function saveAIConfigAction(prevState: any, formData: FormData) {
  try {
    // API keys ahora se leen solo de env vars, no se guardan en cookies
    // Solo guardamos el modelo activo y features en Dexie
    if (formData.has('activeModel')) {
        const activeModel = formData.get('activeModel') as AIModel;
        if (activeModel) {
            const config = await db.getAIConfig();
            await db.saveAIConfig({ ...config, activeModel });
        }
    }

    revalidatePath('/dashboard/settings');
    return { 
      success: true, 
      message: 'Configuración de modelo guardada. Las API keys deben configurarse en .env.local (OPENAI_API_KEY, GOOGLE_API_KEY).' 
    };
  } catch (error) {
    await db.logSystemEvent('ERROR', 'Failed to save AI config', { error: (error as Error).message });
    return { success: false, message: 'Error al guardar la configuración de IA.' };
  }
}

// Nota: saveFcmTokenAction eliminado - ya no se usa Firebase
// Las notificaciones ahora usan la API nativa del navegador

export async function sendTestPushNotificationAction() {
    const user = await db.getLoggedInUser();
    if (!user) {
        return { success: false, message: 'Usuario no autenticado.' };
    }
    try {
        // Las notificaciones ahora se manejan en el cliente usando la Web Notifications API
        // Esta función solo registra el evento en el log
        await sendPushNotification(
            user.id!,
            'Notificación de Prueba',
            '¡La configuración funciona correctamente!',
            '/dashboard'
        );
        return { success: true, message: 'Notificación de prueba solicitada. Revisa tu navegador.' };
    } catch (error) {
        await db.logSystemEvent('ERROR', 'Failed to send test push notification', { error: (error as Error).message });
        return { success: false, message: 'No se pudo enviar la notificación.' };
    }
}

export async function runSyncAction() {
    try {
        const result = await db.syncWithSupabase();
        return result;
    } catch(e: any) {
        await db.logSystemEvent('ERROR', 'Sync failed in action', { error: (e as Error).message });
        return { success: false, message: e.message || "An unknown error occurred during sync." };
    }
}
