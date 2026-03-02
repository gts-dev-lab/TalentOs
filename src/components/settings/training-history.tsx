'use client';

import { ExternalTrainingSettings } from '@/components/settings/external-training-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/enrollments/status-badge';
import type { User } from '@/lib/types';
import * as db from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

function InternalTrainingHistory({ user }: { user: User }) {
  const enrollments = useLiveQuery(() => db.getEnrollmentsForStudent(user.id), [user.id]);

  if (enrollments === undefined) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Formación Interna (Plataforma)</h3>
      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tienes un historial de formación interna todavía.
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Fecha de Solicitud</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/courses/${e.courseId}`}
                      className="hover:underline text-primary"
                    >
                      {e.courseTitle}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {format(new Date(e.requestDate), 'dd MMM, yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function TrainingHistory() {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial Formativo</CardTitle>
        <CardDescription>
          Un registro completo de tu formación, tanto interna como externa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <InternalTrainingHistory user={user} />
        <ExternalTrainingSettings />
      </CardContent>
    </Card>
  );
}
