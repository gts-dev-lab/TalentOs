'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import * as db from '@/lib/db';
import type { User, EnrollmentWithDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { StatusBadge } from './status-badge';

function StudentEnrollmentCard({ enrollment }: { enrollment: EnrollmentWithDetails }) {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!enrollment.id) return;
    setIsCancelling(true);
    try {
      await db.updateEnrollmentStatus(enrollment.id, 'cancelled', 'Cancelado por el usuario.');
      toast({
        title: 'Inscripción Cancelada',
        description: `Has cancelado tu solicitud para ${enrollment.courseTitle}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la inscripción.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canBeCancelled = ['pending', 'waitlisted'].includes(enrollment.status);

  return (
    <Card className="flex flex-col md:flex-row gap-4 p-4">
      <Image
        src={enrollment.courseImage}
        alt={enrollment.courseTitle}
        width={160}
        height={90}
        className="rounded-lg object-cover w-full md:w-40"
      />
      <div className="flex-grow">
        <StatusBadge status={enrollment.status} />
        <h3 className="text-lg font-semibold mt-1">{enrollment.courseTitle}</h3>
        <p className="text-sm text-muted-foreground">
          Solicitud enviada el{' '}
          {format(new Date(enrollment.requestDate), 'dd MMM, yyyy', { locale: es })}
        </p>
        {enrollment.justification && (
          <p className="text-xs text-muted-foreground mt-2 border-l-2 pl-2 italic">
            <strong>Nota del gestor:</strong> {enrollment.justification}
          </p>
        )}
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <Button asChild className="w-full md:w-auto">
          <Link href={`/dashboard/courses/${enrollment.courseId}`}>Ver Curso</Link>
        </Button>
        {canBeCancelled && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full md:w-auto"
                disabled={isCancelling}
              >
                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancelar Solicitud
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar cancelación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se anulará tu solicitud de inscripción para el curso {enrollment.courseTitle}.
                  Podrás volver a solicitarla más tarde si cambias de opinión.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, mantener</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sí, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Card>
  );
}

export function StudentEnrollmentsView({ user }: { user: User }) {
  const enrollments = useLiveQuery(() => db.getEnrollmentsForStudent(user.id), [user.id]);

  const categorizedEnrollments = useMemo(() => {
    if (!enrollments) return { active: [], processing: [], history: [] };

    return {
      active: enrollments.filter(e => ['approved', 'active'].includes(e.status)),
      processing: enrollments.filter(e =>
        ['pending', 'waitlisted', 'needs_review'].includes(e.status)
      ),
      history: enrollments.filter(e =>
        ['completed', 'rejected', 'cancelled', 'expelled', 'expired'].includes(e.status)
      ),
    };
  }, [enrollments]);

  if (!enrollments) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mis Inscripciones</h1>
        <p className="text-muted-foreground">
          Aquí puedes ver el estado de todas tus solicitudes de cursos.
        </p>
      </div>
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="active">
            En Curso ({categorizedEnrollments.active.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            En Proceso ({categorizedEnrollments.processing.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historial ({categorizedEnrollments.history.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {categorizedEnrollments.active.length > 0 ? (
              categorizedEnrollments.active.map(e => (
                <StudentEnrollmentCard key={e.id} enrollment={e} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No tienes inscripciones en cursos activos.
              </p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="processing" className="mt-6">
          <div className="space-y-4">
            {categorizedEnrollments.processing.length > 0 ? (
              categorizedEnrollments.processing.map(e => (
                <StudentEnrollmentCard key={e.id} enrollment={e} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No tienes solicitudes de inscripción en proceso.
              </p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {categorizedEnrollments.history.length > 0 ? (
              categorizedEnrollments.history.map(e => (
                <StudentEnrollmentCard key={e.id} enrollment={e} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">
                Tu historial de inscripciones está vacío.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
