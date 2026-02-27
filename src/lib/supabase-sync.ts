// @ts-nocheck

'use server';

import type Dexie from 'dexie';
import { getSupabaseClient } from './supabase-client';
import * as db from './db';

/**
 * Iterates through a Dexie table, finds unsynced items, pushes them to Supabase,
 * and marks them as synced in Dexie.
 * @param supabase The Supabase client instance (with service_role key).
 * @param dexieTable The Dexie table to process.
 * @param supabaseTable The name of the corresponding Supabase table.
 * @param transform A function to transform the Dexie item into the format expected by Supabase.
 * @param idColumn The name of the unique ID column in the Supabase table (usually 'id').
 */
async function syncTable<T extends { id?: number | string; isSynced?: boolean }>(
  supabase: any,
  dexieTable: Dexie.Table<T, any>,
  supabaseTable: string,
  transform: (item: T) => object,
  idColumn: string = 'id'
): Promise<{ upserted: number; errors: number }> {
  const unsyncedItems = await dexieTable.where('isSynced').equals(false).toArray();
  if (unsyncedItems.length === 0) return { upserted: 0, errors: 0 };

  const itemsToUpsert = unsyncedItems.map(transform);

  const maxRetries = 3;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { error } = await supabase.from(supabaseTable).upsert(itemsToUpsert, {
      onConflict: idColumn,
    });
    if (!error) break;
    lastError = error;
    db.logSystemEvent('WARN', `Supabase sync ${supabaseTable} attempt ${attempt}/${maxRetries} failed`, { error });
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  if (lastError) {
    db.logSystemEvent('ERROR', `Supabase error syncing table ${supabaseTable} after ${maxRetries} attempts`, { error: lastError });
    return { upserted: 0, errors: unsyncedItems.length };
  }

  // Mark items as synced in Dexie
  const syncedIds = unsyncedItems.map(item => item.id!);
  await dexieTable.bulkUpdate(syncedIds.map(id => ({
    key: id,
    changes: { isSynced: true, updatedAt: new Date().toISOString() }
  })));

  return { upserted: unsyncedItems.length, errors: 0 };
}


export async function syncToSupabase(dbInstance: Dexie & { [key: string]: Dexie.Table<any, any> }): Promise<{ success: boolean; message: string; }> {
    let totalUpserted = 0;
    let totalErrors = 0;

    // Get the elevated-privilege Supabase client for server-side operations
    const supabase = getSupabaseClient();

    const syncPlan = [
        {
            dexieTable: dbInstance.users,
            supabaseTable: 'Users',
            transform: (item: any) => {
                const { isSynced, password, passwordHash, ...rest } = item;
                return rest;
            }
        },
        {
            dexieTable: dbInstance.courses,
            supabaseTable: 'Courses',
            transform: (item: any) => {
                 const { isSynced, scormPackage, ...rest } = item;
                 // Note: scormPackage is a Blob and cannot be directly serialized to JSON.
                 // If you need to sync SCORM packages, you would handle this differently,
                 // e.g., by uploading to Supabase Storage and storing the URL.
                 // For now, we simply exclude it.
                 return rest;
            }
        },
        {
            dexieTable: dbInstance.enrollments,
            supabaseTable: 'Enrollments',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            },
            idColumn: 'id' // Primary key in Supabase
        },
        {
            dexieTable: dbInstance.userProgress,
            supabaseTable: 'UserProgress',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            },
            idColumn: 'id'
        },
         {
            dexieTable: dbInstance.costs,
            supabaseTable: 'Costs',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            },
            idColumn: 'id'
        },
        {
            dexieTable: dbInstance.certificateTemplates,
            supabaseTable: 'CertificateTemplates',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            }
        },
        {
            dexieTable: dbInstance.certificates,
            supabaseTable: 'Certificates',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            }
        },
        {
            dexieTable: dbInstance.individualDevelopmentPlans,
            supabaseTable: 'IndividualDevelopmentPlans',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            }
        },
        {
            dexieTable: dbInstance.regulations,
            supabaseTable: 'Regulations',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            }
        },
        {
            dexieTable: dbInstance.regulationCompliance,
            supabaseTable: 'RegulationCompliance',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            }
        },
        {
            dexieTable: dbInstance.complianceAudits,
            supabaseTable: 'ComplianceAudits',
            transform: (item: any) => {
                const { isSynced, ...rest } = item;
                return rest;
            }
        },
    ];

    try {
        for (const plan of syncPlan) {
            const { upserted, errors } = await syncTable(supabase, plan.dexieTable, plan.supabaseTable, plan.transform, plan.idColumn);
            totalUpserted += upserted;
            totalErrors += errors;
        }

        if (totalErrors > 0) {
             return { success: false, message: `Sincronización completada con ${totalErrors} errores.` };
        }
        
        return { success: true, message: `Sincronización completada. ${totalUpserted} registros actualizados en la nube.` };

    } catch (e: any) {
        db.logSystemEvent('ERROR', 'Critical error during sync process', { error: e.message });
        return { success: false, message: `Error crítico: ${e.message}` };
    }
}
