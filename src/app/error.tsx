'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import * as db from '@/lib/db';

function isChunkLoadError(error: Error): boolean {
  return error?.name === 'ChunkLoadError' || /ChunkLoadError|Loading chunk \d+ failed/i.test(String(error?.message ?? ''));
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter();
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    console.error(error);
    db.logSystemEvent('ERROR', error.message, { stack: error.stack, digest: error.digest });
  }, [error]);

  const handleFullReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
             <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 text-3xl font-bold">¡Ups! Algo salió mal</CardTitle>
                <CardDescription>
                  {chunkError
                    ? 'No se pudieron cargar algunos recursos. Haz una recarga completa de la página (Ctrl+Shift+R o Cmd+Shift+R) o usa el botón de abajo.'
                    : 'Hemos encontrado un error inesperado. Por favor, intenta recargar la página.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
                    <p className="font-mono break-all"><strong>Error:</strong> {String(error?.message ?? 'Unknown error')}</p>
                </div>
                 <div className="flex w-full gap-4 flex-wrap">
                   {chunkError && (
                     <Button
                       onClick={handleFullReload}
                       className="w-full"
                       variant="default"
                     >
                       <RefreshCw className="mr-2 h-4 w-4" />
                       Recargar página por completo
                     </Button>
                   )}
                     <Button
                        onClick={() => reset()}
                        className="w-full"
                        variant="outline"
                    >
                        Intentar de Nuevo
                    </Button>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full"
                        variant="outline"
                    >
                        Ir al inicio
                    </Button>
                 </div>
            </CardContent>
        </Card>
    </div>
  )
}
