'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ShieldAlert,
  Trash2,
  ListFilter,
  Info,
  AlertTriangle,
  Bug,
  BrainCircuit,
} from 'lucide-react';
import * as db from '@/lib/db';
import type { SystemLog, LogLevel } from '@/lib/types';
import { logLevels } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { isSuperadmin } from '@/lib/superadmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const logLevelIcons: Record<LogLevel, React.ElementType> = {
  ERROR: Bug,
  WARN: AlertTriangle,
  INFO: Info,
  DEBUG: BrainCircuit,
};

const logLevelColors: Record<LogLevel, string> = {
  ERROR:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  WARN: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
  INFO: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  DEBUG:
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
};

export default function LogsPage() {
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const logs = useLiveQuery(
    () => db.getSystemLogs(levelFilter === 'ALL' ? undefined : levelFilter),
    [levelFilter],
    []
  );

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }
  if (user.role !== 'Administrador General' && !isSuperadmin(user.email)) {
    router.push('/dashboard');
    return null;
  }

  const handleClearLogs = async () => {
    try {
      await db.clearAllSystemLogs();
      toast({
        title: 'Registros Eliminados',
        description: 'El registro del sistema ha sido limpiado.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los registros.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Registro del Sistema</h1>
            <p className="text-muted-foreground">
              Monitoriza eventos, advertencias y errores de la aplicación.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Eventos Registrados</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Filtrar ({levelFilter})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={levelFilter}
                    onValueChange={v => setLevelFilter(v as any)}
                  >
                    <DropdownMenuRadioItem value="ALL">Todos los Niveles</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    {logLevels.map(level => (
                      <DropdownMenuRadioItem key={level} value={level}>
                        {level}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpiar Registros
                </Button>
              </AlertDialogTrigger>
            </div>
          </CardHeader>
          <CardContent>
            {logs === undefined ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldAlert className="mx-auto h-12 w-12" />
                <p className="mt-4 font-semibold">No hay registros que mostrar.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {logs.map(log => {
                  const Icon = logLevelIcons[log.level];
                  const color = logLevelColors[log.level];
                  return (
                    <AccordionItem
                      value={`item-${log.id}`}
                      key={log.id}
                      className="border rounded-lg px-4 data-[state=closed]:hover:bg-muted/50 transition-colors"
                    >
                      <AccordionTrigger className="w-full hover:no-underline text-left">
                        <div className="flex items-center gap-4 w-full">
                          <Badge variant="outline" className={color}>
                            <Icon className="mr-1 h-3 w-3" />
                            {log.level}
                          </Badge>
                          <span className="text-sm text-muted-foreground w-40 hidden md:inline">
                            {format(new Date(log.timestamp), 'dd MMM, HH:mm:ss', { locale: es })}
                          </span>
                          <span className="truncate flex-1 pr-4">{log.message}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 bg-muted/50 rounded-b-lg">
                          <h4 className="font-semibold mb-2">Detalles del Evento</h4>
                          <pre className="text-xs font-mono bg-background p-3 rounded-md whitespace-pre-wrap break-all overflow-x-auto">
                            {JSON.stringify({ message: log.message, ...log.details }, null, 2)}
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar limpieza de registros?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente todos los registros del sistema. No se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearLogs}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, limpiar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}
