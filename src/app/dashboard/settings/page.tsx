'use client';

import { useAuth } from '@/contexts/auth';
import { isSuperadmin } from '@/lib/superadmin';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiSettings } from '@/components/settings/api-settings';
import { PermissionSettings } from '@/components/settings/permission-settings';
import { AISettings } from '@/components/settings/ai-settings';
import { GeneralSettings } from '@/components/settings/general-settings';
import { SyncManager } from '@/components/settings/sync-manager';
import { BackupManager } from '@/components/settings/backup-manager';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );

  const canAccessSettings = user.role === 'Administrador General' || isSuperadmin(user.email);
  if (!canAccessSettings) {
    router.push('/dashboard');
    return null;
  }

  const adminTabs = [
    { value: 'permissions', label: 'Permisos' },
    { value: 'ai', label: 'Inteligencia Artificial' },
    { value: 'certificates', label: 'Certificados' },
    { value: 'sync', label: 'Sincronización' },
    { value: 'backup', label: 'Backups y Mantenimiento' },
    { value: 'api', label: 'APIs Externas' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ajustes de la Plataforma</h1>
        <p className="text-muted-foreground">Configuración global para administradores.</p>
      </div>
      <div className="grid grid-cols-1 gap-8">
        <Tabs defaultValue="permissions" className="w-full" orientation="vertical">
          <TabsList className="grid w-full max-w-xs grid-cols-1 h-auto">
            {adminTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="justify-start">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="permissions" className="mt-4 md:mt-0">
            <PermissionSettings />
          </TabsContent>
          <TabsContent value="ai" className="mt-4 md:mt-0">
            <AISettings />
          </TabsContent>
          <TabsContent value="certificates" className="mt-4 md:mt-0">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="sync" className="mt-4 md:mt-0">
            <SyncManager />
          </TabsContent>
          <TabsContent value="backup" className="mt-4 md:mt-0">
            <BackupManager />
          </TabsContent>
          <TabsContent value="api" className="mt-4 md:mt-0">
            <ApiSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
