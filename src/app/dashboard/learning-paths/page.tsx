'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, PlusCircle, Route, MoreHorizontal, FilePenLine, Trash2 } from 'lucide-react';
import * as db from '@/lib/db';
import type { LearningPath, Course } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

export default function LearningPathsPage() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const learningPaths = useLiveQuery(() => db.getAllLearningPaths(), []);
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);
  const [pathToDelete, setPathToDelete] = useState<LearningPath | null>(null);

  const courseMap = new Map(allCourses?.map(c => [c.id, c.title]));

  const handleDelete = async () => {
    if (!pathToDelete?.id) return;
    try {
      await db.deleteLearningPath(pathToDelete.id);
      toast({
        title: 'Plan de Carrera Eliminado',
        description: `El plan "${pathToDelete.title}" ha sido eliminado.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el plan de carrera.',
        variant: 'destructive',
      });
    } finally {
      setPathToDelete(null);
    }
  };

  if (!learningPaths || !allCourses) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const totalPages = Math.ceil(learningPaths.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPaths = learningPaths.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <AlertDialog>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Planes de Carrera</h1>
            <p className="text-muted-foreground">
              Crea y gestiona rutas de aprendizaje guiadas para los empleados.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/learning-paths/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Plan
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planes de Carrera Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Rol Asignado</TableHead>
                    <TableHead>Cursos</TableHead>
                    <TableHead className="w-[100px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learningPaths.length > 0 ? (
                    learningPaths.map(path => (
                      <TableRow key={path.id}>
                        <TableCell className="font-medium">{path.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{path.targetRole}</Badge>
                        </TableCell>
                        <TableCell>{path.courseIds.length} cursos</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/learning-paths/${path.id}/edit`}>
                                  <FilePenLine className="mr-2 h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={() => setPathToDelete(path)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No has creado ningún plan de carrera todavía.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {learningPaths.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  totalItems={learningPaths.length}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el plan de carrera "{pathToDelete?.title}" y todo el progreso
              asociado de los usuarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPathToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
