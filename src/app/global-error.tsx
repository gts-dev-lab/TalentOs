'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">¡Ups! Algo salió mal</h1>
          <p className="mt-2 text-muted-foreground">
            Hemos encontrado un error inesperado en la aplicación.
          </p>
          <Button onClick={() => reset()} className="mt-6">
            Intentar de Nuevo
          </Button>
        </div>
      </body>
    </html>
  );
}
