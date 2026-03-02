'use client';

import * as db from './db';
import type { SystemLog, LogLevel } from './types';

export interface DatabaseMetrics {
  totalRecords: number;
  tableCounts: Record<string, number>;
  totalSize: number;
  unsyncedCount: number;
  recentActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  errorRate: {
    last24h: number;
    last7d: number;
  };
  performance: {
    avgQueryTime?: number;
    slowQueries?: number;
  };
}

/**
 * Gets comprehensive database metrics for monitoring
 */
export async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
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
  let unsyncedCount = 0;

  // Get counts for all tables
  for (const tableName of tables) {
    const table = (db.db as any)[tableName];
    if (table) {
      const count = await table.count();
      tableCounts[tableName] = count;
      totalRecords += count;

      // Count unsynced items if table has isSynced field
      if (
        [
          'users',
          'courses',
          'enrollments',
          'userProgress',
          'costs',
          'certificates',
          'certificateTemplates',
          'individualDevelopmentPlans',
          'regulations',
          'regulationCompliance',
          'complianceAudits',
          'calendarEvents',
        ].includes(tableName)
      ) {
        try {
          const unsynced = await table.where('isSynced').equals(false).count();
          unsyncedCount += unsynced;
        } catch (e) {
          // Table might not have isSynced field, ignore
        }
      }
    }
  }

  // Estimate size (rough calculation)
  const totalSize = JSON.stringify(tableCounts).length * 100;

  // Get recent activity from system logs
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const allLogs = await db.getSystemLogs();
  const recentLogs = allLogs.filter(log => new Date(log.timestamp) >= last30d);

  const recentActivity = {
    last24h: recentLogs.filter(log => new Date(log.timestamp) >= last24h).length,
    last7d: recentLogs.filter(log => new Date(log.timestamp) >= last7d).length,
    last30d: recentLogs.length,
  };

  // Calculate error rate
  const errorLogs24h = recentLogs.filter(
    log => new Date(log.timestamp) >= last24h && (log.level === 'ERROR' || log.level === 'WARN')
  );
  const errorLogs7d = recentLogs.filter(
    log => new Date(log.timestamp) >= last7d && (log.level === 'ERROR' || log.level === 'WARN')
  );

  const errorRate = {
    last24h: recentActivity.last24h > 0 ? (errorLogs24h.length / recentActivity.last24h) * 100 : 0,
    last7d: recentActivity.last7d > 0 ? (errorLogs7d.length / recentActivity.last7d) * 100 : 0,
  };

  return {
    totalRecords,
    tableCounts,
    totalSize,
    unsyncedCount,
    recentActivity,
    errorRate,
    performance: {
      // Placeholder for future performance metrics
    },
  };
}

/**
 * Gets table growth statistics
 */
export async function getTableGrowthStats(
  days: number = 30
): Promise<Record<string, { current: number; growth: number }>> {
  // This would ideally track historical data, but for now we'll return current counts
  // In a production system, you'd store historical snapshots
  const tables = [
    'users',
    'courses',
    'enrollments',
    'userProgress',
    'forumMessages',
    'notifications',
    'chatMessages',
    'systemLogs',
    'certificates',
  ];

  const stats: Record<string, { current: number; growth: number }> = {};

  for (const tableName of tables) {
    const table = (db.db as any)[tableName];
    if (table) {
      const current = await table.count();
      // Estimate growth based on recent activity (simplified)
      const growth = Math.round(current * 0.05); // Placeholder: 5% growth estimate
      stats[tableName] = { current, growth };
    }
  }

  return stats;
}

/**
 * Gets query performance metrics
 */
export async function getQueryPerformanceMetrics(): Promise<{
  slowQueries: number;
  avgQueryTime: number;
  totalQueries: number;
}> {
  // This would require instrumentation of queries
  // For now, return placeholder data
  return {
    slowQueries: 0,
    avgQueryTime: 0,
    totalQueries: 0,
  };
}

/**
 * Gets database health status
 */
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}> {
  const metrics = await getDatabaseMetrics();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check unsynced items
  if (metrics.unsyncedCount > 100) {
    issues.push(`${metrics.unsyncedCount} elementos sin sincronizar`);
    recommendations.push('Ejecutar sincronización con Supabase');
  }

  // Check error rate
  if (metrics.errorRate.last24h > 10) {
    issues.push(`Tasa de errores alta: ${metrics.errorRate.last24h.toFixed(1)}%`);
    recommendations.push('Revisar logs del sistema para identificar problemas');
  }

  // Check database size
  if (metrics.totalSize > 50 * 1024 * 1024) {
    // 50MB
    issues.push(`Base de datos grande: ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB`);
    recommendations.push('Considerar ejecutar limpieza de datos antiguos');
  }

  // Check table sizes
  const largeTables = Object.entries(metrics.tableCounts)
    .filter(([, count]) => count > 10000)
    .map(([table]) => table);

  if (largeTables.length > 0) {
    issues.push(`Tablas grandes detectadas: ${largeTables.join(', ')}`);
    recommendations.push('Considerar paginación o archivo de datos antiguos');
  }

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (issues.length > 0) {
    status = issues.length > 2 ? 'critical' : 'warning';
  }

  return {
    status,
    issues,
    recommendations,
  };
}
