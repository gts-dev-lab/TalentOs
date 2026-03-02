'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Loader2,
  PlusCircle,
  Target,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { IndividualDevelopmentPlan, User as UserType, Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

const statusConfig: Record<
  IndividualDevelopmentPlan['status'],
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    icon: typeof CheckCircle2;
  }
> = {
  draft: { label: 'Borrador', variant: 'outline', icon: Clock },
  active: { label: 'Activo', variant: 'default', icon: CheckCircle2 },
  completed: { label: 'Completado', variant: 'secondary', icon: CheckCircle2 },
  archived: { label: 'Archivado', variant: 'outline', icon: Archive },
};

export default function PDIPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const isManager =
    user && ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);

  const pdis = useLiveQuery(() => {
    if (!user) return Promise.resolve([]);
    if (isManager && user.role === 'Administrador General') {
      return db.getAllPDIs();
    }
    if (isManager) {
      return db.getPDIsForManager(user.id);
    }
    return db.getPDIsForUser(user.id);
  }, [user?.id, isManager]);

  const users = useLiveQuery(() => db.getAllUsers(), []);
  const courses = useLiveQuery(() => db.getAllCourses(), []);

  const usersById = useMemo(() => new Map((users || []).map(u => [u.id, u])), [users]);
  const coursesById = useMemo(() => new Map((courses || []).map(c => [c.id, c])), [courses]);

  const totalPages = useMemo(() => Math.ceil((pdis || []).length / itemsPerPage), [pdis]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPDIs = useMemo(
    () => (pdis || []).slice(startIndex, endIndex),
    [pdis, startIndex, endIndex]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user || pdis === undefined || users === undefined || courses === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Planes de Desarrollo Individual
          </h1>
          <p className="text-muted-foreground">
            {isManager
              ? 'Gestiona los planes de desarrollo de tu equipo'
              : 'Consulta y sigue tu plan de desarrollo personalizado'}
          </p>
        </div>
        {isManager && (
          <Button asChild>
            <Link href="/dashboard/pdi/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear PDI
            </Link>
          </Button>
        )}
      </div>

      {paginatedPDIs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay PDIs</CardTitle>
            <CardDescription>
              {isManager
                ? 'Aún no has creado ningún Plan de Desarrollo Individual para tu equipo.'
                : 'Aún no tienes un Plan de Desarrollo Individual asignado.'}
            </CardDescription>
          </CardHeader>
          {isManager && (
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/pdi/new">Crear tu primer PDI</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedPDIs.map(pdi => {
              const employee = usersById.get(pdi.userId);
              const manager = usersById.get(pdi.managerId);
              const statusInfo = statusConfig[pdi.status];
              const StatusIcon = statusInfo.icon;
              const completedCourses = pdi.courseIds.filter(cid => {
                const progress = courses?.find(c => c.id === cid);
                return progress; // Simplified - would check actual completion
              }).length;

              return (
                <Card key={pdi.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{pdi.title}</CardTitle>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">{pdi.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {isManager && employee && (
                          <div>
                            <span className="text-muted-foreground">Empleado:</span>
                            <p className="font-medium">{employee.name}</p>
                          </div>
                        )}
                        {manager && (
                          <div>
                            <span className="text-muted-foreground">Manager:</span>
                            <p className="font-medium">{manager.name}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Inicio:</span>
                          <p className="font-medium">
                            {new Date(pdi.startDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        {pdi.endDate && (
                          <div>
                            <span className="text-muted-foreground">Fin:</span>
                            <p className="font-medium">
                              {new Date(pdi.endDate).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cursos:</span>
                          <span className="ml-2 font-medium">
                            {completedCourses}/{pdi.courseIds.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hitos:</span>
                          <span className="ml-2 font-medium">
                            {pdi.milestones.filter(m => m.completed).length}/{pdi.milestones.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revisiones:</span>
                          <span className="ml-2 font-medium">{pdi.reviews.length}</span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/pdi/${pdi.id}`}>Ver detalles</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {pdis.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={pdis.length}
            />
          )}
        </>
      )}
    </div>
  );
}
