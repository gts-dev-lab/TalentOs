'use server';

import * as db from './db';
import { differenceInDays, addDays } from 'date-fns';
import type { RegulationCompliance } from './types';

/**
 * Checks for expiring compliance records and sends notifications
 * @param daysAhead - Number of days ahead to check (default: 30)
 * @returns Number of alerts sent
 */
export async function checkAndSendComplianceAlerts(daysAhead: number = 30): Promise<number> {
  try {
    const expiringCompliance = await db.getExpiringCompliance(daysAhead);
    const today = new Date();
    let alertsSent = 0;

    for (const compliance of expiringCompliance) {
      if (!compliance.expirationDate) continue;

      const expDate = new Date(compliance.expirationDate);
      const daysUntilExpiry = differenceInDays(expDate, today);

      // Only send alerts for compliance expiring in the next 30 days
      if (daysUntilExpiry > 0 && daysUntilExpiry <= daysAhead) {
        const user = await db.getUserById(compliance.userId);
        const regulation = await db.getRegulationById(compliance.regulationId);

        if (!user || !regulation) continue;

        // Check if we already sent an alert for this compliance recently (within last 7 days)
        const recentNotifications = await db.getNotificationsForUser(user.id!);
        const hasRecentAlert = recentNotifications.some(
          n =>
            n.type === 'course_deadline_reminder' &&
            n.relatedUrl?.includes(`/dashboard/compliance/${regulation.id}`) &&
            new Date(n.timestamp).getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        if (!hasRecentAlert) {
          const message =
            daysUntilExpiry === 1
              ? `⚠️ URGENTE: Tu cumplimiento de la normativa "${regulation.name}" (${regulation.code}) vence MAÑANA. Por favor, renueva tu certificación.`
              : `⚠️ Tu cumplimiento de la normativa "${regulation.name}" (${regulation.code}) vence en ${daysUntilExpiry} días. Por favor, renueva tu certificación.`;

          await db.addNotification({
            userId: user.id!,
            message,
            type: 'course_deadline_reminder',
            relatedUrl: `/dashboard/compliance/${regulation.id}`,
            isRead: false,
            timestamp: new Date().toISOString(),
          });

          alertsSent++;
        }
      }
    }

    return alertsSent;
  } catch (error) {
    console.error('Error checking compliance alerts:', error);
    await db.logSystemEvent('ERROR', 'Failed to check compliance alerts', {
      error: (error as Error).message,
    });
    return 0;
  }
}

/**
 * Gets compliance records that are expired or expiring soon
 * @param daysAhead - Number of days ahead to check (default: 30)
 * @returns Array of compliance records with status information
 */
export async function getComplianceAlerts(daysAhead: number = 30): Promise<
  Array<
    RegulationCompliance & {
      userName: string;
      regulationName: string;
      regulationCode: string;
      daysUntilExpiry: number;
      status: 'expired' | 'expiring' | 'compliant';
    }
  >
> {
  try {
    const allRegulations = await db.getActiveRegulations();
    const allUsers = await db.getAllUsers();
    const today = new Date();
    const alerts: Array<
      RegulationCompliance & {
        userName: string;
        regulationName: string;
        regulationCode: string;
        daysUntilExpiry: number;
        status: 'expired' | 'expiring' | 'compliant';
      }
    > = [];

    for (const regulation of allRegulations) {
      const complianceRecords = await db.getComplianceForRegulation(regulation.id);

      for (const compliance of complianceRecords) {
        if (!compliance.expirationDate) continue;

        const expDate = new Date(compliance.expirationDate);
        const daysUntilExpiry = differenceInDays(expDate, today);

        if (daysUntilExpiry <= daysAhead) {
          const user = allUsers.find(u => u.id === compliance.userId);
          if (!user) continue;

          const status: 'expired' | 'expiring' | 'compliant' =
            daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry <= 30 ? 'expiring' : 'compliant';

          alerts.push({
            ...compliance,
            userName: user.name,
            regulationName: regulation.name,
            regulationCode: regulation.code,
            daysUntilExpiry,
            status,
          });
        }
      }
    }

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  } catch (error) {
    console.error('Error getting compliance alerts:', error);
    return [];
  }
}
