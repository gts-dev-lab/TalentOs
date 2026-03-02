'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Certificados</CardTitle>
          <CardDescription>
            Previsualiza las plantillas de certificados y elige cuál se usará por defecto en la
            plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            La configuración de las plantillas de certificados se ha movido a su propia sección para
            una mejor organización.
          </p>
          <Button asChild>
            <Link href="/dashboard/settings/certificates">
              Ir a Gestión de Certificados
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
