'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runSyncAction } from '@/app/dashboard/settings/actions';

export function SyncManager() {
  const { toast } = useToast();
  const unsyncedCount = useLiveQuery(() => db.getUnsyncedItemsCount(), [], 0);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    toast({
      title: 'Iniciando Sincronización',
      description: 'Enviando cambios locales a la nube...',
    });

    const result = await runSyncAction();

    if (result.success) {
      toast({
        title: 'Sincronización Exitosa',
        description: result.message,
      });
    } else {
      toast({
        title: 'Error de Sincronización',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsSyncing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sincronización con la Nube</CardTitle>
        <CardDescription>
          Gestiona la sincronización de los datos locales con el backend en Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-6xl font-bold text-primary">{unsyncedCount}</p>
          <p className="text-muted-foreground">cambios pendientes de sincronizar.</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing || unsyncedCount === 0} className="w-full">
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar con Supabase
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
