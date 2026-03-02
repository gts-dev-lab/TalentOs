'use client';

import Dexie from 'dexie';
import * as db from './db';
import type { SystemLog } from './types';

export interface BackupMetadata {
  timestamp: string;
  version: string;
  size: number;
  recordCounts: Record<string, number>;
}

/**
 * Exports all data from Dexie to a JSON file
 * @returns Blob containing the backup data
 */
export async function exportDatabaseBackup(): Promise<{ blob: Blob; metadata: BackupMetadata }> {
  try {
    const tables = [
      'users',
      'courses',
      'enrollments',
      'userProgress',
      'forumMessages',
      'notifications',
      'resources',
      'courseResources',
      'announcements',
      'chatChannels',
      'chatMessages',
      'calendarEvents',
      'externalTrainings',
      'costs',
      'aiConfig',
      'aiUsageLog',
      'badges',
      'userBadges',
      'costCategories',
      'learningPaths',
      'userLearningPathProgress',
      'courseRatings',
      'rolePermissions',
      'systemLogs',
      'certificates',
      'certificateTemplates',
      'individualDevelopmentPlans',
      'regulations',
      'regulationCompliance',
      'complianceAudits',
    ];

    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};

    for (const tableName of tables) {
      const table = (db.db as any)[tableName] as Dexie.Table<any, any>;
      if (table) {
        const data = await table.toArray();
        // Remove sensitive data
        if (tableName === 'users') {
          backupData[tableName] = data.map((u: any) => {
            const { passwordHash, fcmToken, ...rest } = u;
            return rest;
          });
        } else {
          backupData[tableName] = data;
        }
        recordCounts[tableName] = data.length;
      }
    }

    const metadata: BackupMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      size: JSON.stringify(backupData).length,
      recordCounts,
    };

    const fullBackup = {
      metadata,
      data: backupData,
    };

    const jsonString = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    await db.logSystemEvent('INFO', 'Database backup exported', {
      recordCounts,
      size: metadata.size,
    });

    return { blob, metadata };
  } catch (error) {
    console.error('Error exporting backup:', error);
    await db.logSystemEvent('ERROR', 'Failed to export database backup', {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Imports data from a backup file into Dexie
 * @param file - File containing the backup JSON
 * @param options - Import options
 */
export async function importDatabaseBackup(
  file: File,
  options: {
    clearExisting?: boolean;
    skipTables?: string[];
  } = {}
): Promise<{ imported: number; errors: number }> {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup.metadata || !backup.data) {
      throw new Error('Invalid backup file format');
    }

    const { clearExisting = false, skipTables = [] } = options;
    let imported = 0;
    let errors = 0;

    await db.db.transaction('rw', db.db.users, db.db.courses, async () => {
      for (const [tableName, data] of Object.entries(backup.data)) {
        if (skipTables.includes(tableName)) continue;

        const table = (db.db as any)[tableName] as Dexie.Table<any, any>;
        if (!table) {
          console.warn(`Table ${tableName} not found, skipping`);
          continue;
        }

        try {
          if (clearExisting) {
            await table.clear();
          }

          if (Array.isArray(data) && data.length > 0) {
            await table.bulkPut(data);
            imported += data.length;
          }
        } catch (error) {
          console.error(`Error importing table ${tableName}:`, error);
          errors++;
        }
      }
    });

    await db.logSystemEvent('INFO', 'Database backup imported', {
      imported,
      errors,
      clearExisting,
    });

    return { imported, errors };
  } catch (error) {
    console.error('Error importing backup:', error);
    await db.logSystemEvent('ERROR', 'Failed to import database backup', {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Downloads a backup file
 */
export function downloadBackup(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `talentos-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Gets database statistics
 */
export async function getDatabaseStats(): Promise<{
  totalRecords: number;
  tableCounts: Record<string, number>;
  totalSize: number;
  lastBackup?: string;
}> {
  const tables = [
    'users',
    'courses',
    'enrollments',
    'userProgress',
    'forumMessages',
    'notifications',
    'resources',
    'courseResources',
    'announcements',
    'chatChannels',
    'chatMessages',
    'calendarEvents',
    'externalTrainings',
    'costs',
    'aiConfig',
    'aiUsageLog',
    'badges',
    'userBadges',
    'costCategories',
    'learningPaths',
    'userLearningPathProgress',
    'courseRatings',
    'rolePermissions',
    'systemLogs',
    'certificates',
    'certificateTemplates',
    'individualDevelopmentPlans',
    'regulations',
    'regulationCompliance',
    'complianceAudits',
  ];

  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const tableName of tables) {
    const table = (db.db as any)[tableName] as Dexie.Table<any, any>;
    if (table) {
      const count = await table.count();
      tableCounts[tableName] = count;
      totalRecords += count;
    }
  }

  // Estimate size (rough calculation)
  const totalSize = JSON.stringify(tableCounts).length * 100; // Rough estimate

  return {
    totalRecords,
    tableCounts,
    totalSize,
  };
}

/**
 * Cleans up old data based on retention policies
 */
export async function cleanupOldData(
  options: {
    notificationsDays?: number;
    systemLogsDays?: number;
    aiUsageLogDays?: number;
  } = {}
): Promise<{ deleted: number; errors: number }> {
  const { notificationsDays = 90, systemLogsDays = 180, aiUsageLogDays = 365 } = options;

  const cutoffDate = new Date();
  let deleted = 0;
  let errors = 0;

  try {
    // Clean old notifications
    if (notificationsDays > 0) {
      const notificationCutoff = new Date(cutoffDate);
      notificationCutoff.setDate(notificationCutoff.getDate() - notificationsDays);
      const oldNotifications = await db.db.notifications
        .where('timestamp')
        .below(notificationCutoff.toISOString())
        .toArray();

      if (oldNotifications.length > 0) {
        await db.db.notifications.bulkDelete(oldNotifications.map(n => n.id!));
        deleted += oldNotifications.length;
      }
    }

    // Clean old system logs (keep errors and warnings longer)
    if (systemLogsDays > 0) {
      const logCutoff = new Date(cutoffDate);
      logCutoff.setDate(logCutoff.getDate() - systemLogsDays);
      const oldLogs = await db.db.systemLogs
        .where('timestamp')
        .below(logCutoff.toISOString())
        .filter(log => log.level === 'INFO')
        .toArray();

      if (oldLogs.length > 0) {
        await db.db.systemLogs.bulkDelete(oldLogs.map(l => l.id!));
        deleted += oldLogs.length;
      }
    }

    // Clean old AI usage logs
    if (aiUsageLogDays > 0) {
      const aiCutoff = new Date(cutoffDate);
      aiCutoff.setDate(aiCutoff.getDate() - aiUsageLogDays);
      const oldAiLogs = await db.db.aiUsageLog
        .where('timestamp')
        .below(aiCutoff.toISOString())
        .toArray();

      if (oldAiLogs.length > 0) {
        await db.db.aiUsageLog.bulkDelete(oldAiLogs.map(l => l.id!));
        deleted += oldAiLogs.length;
      }
    }

    await db.logSystemEvent('INFO', 'Database cleanup completed', {
      deleted,
      errors,
    });

    return { deleted, errors };
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    await db.logSystemEvent('ERROR', 'Failed to cleanup old data', {
      error: (error as Error).message,
    });
    return { deleted, errors: 1 };
  }
}
