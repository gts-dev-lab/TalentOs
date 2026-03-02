'use server';

import * as db from '@/lib/db';
import type { Announcement } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCurrentTenantId } from '@/lib/tenant-context';

export async function createAndNotifyAnnouncement(
  announcementData: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt' | 'timestamp'>
) {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    return { success: false, message: 'No hay contexto de inquilino. Acceso denegado.' };
  }

  try {
    const newAnnouncement: Announcement = {
      ...announcementData,
      timestamp: new Date().toISOString(),
    };

    await db.addAnnouncement(newAnnouncement);

    // Notify users
    const allUsers = await db.getAllUsers();
    const targetUsers = allUsers.filter(
      user =>
        announcementData.channels.includes('Todos') ||
        announcementData.channels.includes(user.role) ||
        announcementData.channels.includes(user.department)
    );

    if (targetUsers.length > 0) {
      const notificationMessage = `${announcementData.title}: ${announcementData.content.substring(0, 100)}...`;

      for (const user of targetUsers) {
        await db.addNotification({
          userId: user.id,
          message: notificationMessage,
          type: 'course_announcement', // Re-using a generic type
          relatedUrl: '/dashboard',
          isRead: false,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      success: true,
      message: `Aviso creado y notificado a ${targetUsers.length} usuarios.`,
    };
  } catch (error) {
    console.error('Failed to create and notify announcement', error);
    return { success: false, message: 'No se pudo crear el aviso.' };
  }
}
