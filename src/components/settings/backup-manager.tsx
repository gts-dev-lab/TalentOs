'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Database, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  exportDatabaseBackup, 
  importDatabaseBackup, 
  downloadBackup, 
  getDatabaseStats,
  cleanupOldData,
  type BackupMetadata 
} from '@/lib/backup-service';
import { getDatabaseMetrics, getDatabaseHealth, type DatabaseMetrics } from '@/lib/db-monitoring';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function BackupManager() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [stats, setStats] = useState<{
    totalRecords: number;
    tableCounts: Record<string, number>;
    totalSize: number;
  } | null>(null);
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [health, setHealth] = useState<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);

  useEffect(() => {
    loadStats();
    loadMetrics();
    loadHealth();
  }, []);

  const loadStats = async () => {
    try {
      const databaseStats = await getDatabaseStats();
      setStats(databaseStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const databaseMetrics = await getDatabaseMetrics();
      setMetrics(databaseMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadHealth = async () => {
    try {
      const databaseHealth = await getDatabaseHealth();
      setHealth(databaseHealth);
    } catch (error) {
      console.error('Error loading health:', error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { blob, metadata } = await exportDatabaseBackup();
      downloadBackup(blob, `talentos-backup-${format(new Date(metadata.timestamp), 'yyyy-MM-dd-HHmmss')}.json`);
      toast({
        title: 'Backup Exportado',
        description: `Backup creado exitosamente. ${Object.keys(metadata.recordCounts).length} tablas exportadas.`,
      });
      await loadStats();
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el backup.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de backup.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await importDatabaseBackup(importFile, { clearExisting });
      toast({
        title: 'Backup Importado',
        description: `${result.imported} registros importados${result.errors > 0 ? `, ${result.errors} errores` : ''}.`,
      });
      setImportFile(null);
      await loadStats();
    } catch (error) {
      console.error('Error importing backup:', error);
      toast({
        title: 'Error',
        description: 'No se pudo importar el backup. Verifica que el archivo sea válido.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const result = await cleanupOldData({
        notificationsDays: 90,
        systemLogsDays: 180,
        aiUsageLogDays: 365,
      });
      toast({
        title: 'Limpieza Completada',
        description: `${result.deleted} registros antiguos eliminados.`,
      });
      await loadStats();
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast({
        title: 'Error',
        description: 'No se pudo completar la limpieza.',
        variant: 'destructive',
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estadísticas de la Base de Datos
          </CardTitle>
          <CardDescription>Información sobre el tamaño y contenido de la base de datos local</CardDescription>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total de Registros</div>
                  <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tamaño Estimado</div>
                  <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tablas</div>
                  <div className="text-2xl font-bold">{Object.keys(stats.tableCounts).length}</div>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Registros por Tabla</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Object.entries(stats.tableCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([table, count]) => (
                      <div key={table} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{table}</span>
                        <span className="font-medium">{count.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { loadStats(); loadMetrics(); loadHealth(); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar Todo
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Cargando estadísticas...</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Backup
          </CardTitle>
          <CardDescription>Descarga una copia completa de la base de datos local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              El backup incluye todos los datos excepto contraseñas y tokens FCM por seguridad.
              Guarda este archivo en un lugar seguro.
            </AlertDescription>
          </Alert>
          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            {isExporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Backup
          </CardTitle>
          <CardDescription>Restaura la base de datos desde un archivo de backup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Importar un backup reemplazará los datos existentes. Asegúrate de exportar un backup antes de importar.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label>Archivo de Backup</Label>
            <Input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="clearExisting"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="clearExisting" className="text-sm">
              Limpiar datos existentes antes de importar
            </Label>
          </div>
          <Button 
            onClick={handleImport} 
            disabled={isImporting || !importFile} 
            variant="destructive"
            className="w-full"
          >
            {isImporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Limpieza de Datos Antiguos
          </CardTitle>
          <CardDescription>Elimina registros antiguos para optimizar el rendimiento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Política de Retención</AlertTitle>
            <AlertDescription>
              Se eliminarán: Notificaciones antiguas (90 días), Logs del sistema INFO (180 días), 
              Logs de uso de IA (365 días). Los errores y advertencias se conservan más tiempo.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleCleanup} 
            disabled={isCleaning} 
            variant="outline"
            className="w-full"
          >
            {isCleaning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Limpiando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Ejecutar Limpieza
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
