'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { exportUserData, requestErasure } from '@/lib/gdpr';
import { exportAllDataForMigration } from '@/lib/export-for-migration';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Download, Trash2, ShieldAlert, Database } from 'lucide-react';

export function PrivacyAndDataSettings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingMigration, setIsExportingMigration] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const data = await exportUserData(user.id);
      if (!data) {
        toast({
          title: 'Error',
          description: 'No se pudieron obtener tus datos.',
          variant: 'destructive',
        });
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentos-datos-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Exportación completada',
        description: 'Se ha descargado un archivo JSON con tus datos personales.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudo exportar tus datos. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportForMigration = async () => {
    if (!user) return;
    setIsExportingMigration(true);
    try {
      const data = await exportAllDataForMigration();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentos-migration-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Exportación para migración',
        description:
          'Se ha descargado el JSON. Usa scripts/migrate-indexeddb-to-postgres.mjs con este archivo y el tenant_id.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudo exportar para migración.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingMigration(false);
    }
  };

  const handleRequestErasure = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const result = await requestErasure(user.id, { notify: true });
      if (!result.ok) {
        toast({
          title: 'Error',
          description: result.error ?? 'No se pudo completar la solicitud.',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }
      toast({
        title: 'Cuenta eliminada',
        description: 'Tu cuenta ha sido eliminada. Recibirás un correo de confirmación.',
      });
      logout();
      router.push('/login');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudo completar la solicitud. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Datos personales y privacidad (RGPD)</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Tienes derecho a acceder a tus datos y a solicitar su eliminación (derecho al olvido).
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-wrap">
        <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar mis datos
        </Button>
        <Button
          variant="outline"
          onClick={handleExportForMigration}
          disabled={isExportingMigration}
          title="Exportar toda la base IndexedDB para cargar en PostgreSQL (admin/migración)"
        >
          {isExportingMigration ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          Exportar para migración PostgreSQL
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Solicitar eliminación de cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará tu cuenta y tus datos personales de forma permanente (borrado
                lógico). Recibirás un correo de confirmación. No podrás volver a iniciar sesión con
                esta cuenta. ¿Estás seguro?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={e => {
                  e.preventDefault();
                  handleRequestErasure();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, eliminar mi cuenta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
