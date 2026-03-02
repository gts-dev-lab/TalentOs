'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hourglass } from 'lucide-react';
import { AppLogo } from '@/components/icons';

export default function PendingApprovalPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Hourglass className="h-8 w-8" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">Cuenta Pendiente de Aprobación</CardTitle>
          <CardDescription>
            Gracias por registrarte. Un administrador revisará tu solicitud pronto. Recibirás una
            notificación cuando tu cuenta sea activada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Volver a Inicio de Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
