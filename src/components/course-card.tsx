'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  BookOpen,
  MoreVertical,
  FilePenLine,
  Trash2,
  AlertTriangle,
  Pencil,
  Archive,
} from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Course, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { downloadCourseAsScormZip } from '@/lib/scorm-service';

interface CourseCardProps {
  course: Course;
  user: User;
  progress: number;
  canManage?: boolean;
}

export const CourseCard = React.memo(function CourseCard({
  course,
  user,
  progress,
  canManage = false,
}: CourseCardProps) {
  const { toast } = useToast();

  const isMandatory = course.mandatoryForRoles?.includes(user.role);

  const handleDelete = async () => {
    try {
      await db.deleteCourse(course.id);
      toast({
        title: 'Curso Eliminado',
        description: `El curso "${course.title}" ha sido eliminado.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el curso.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  const handleScormExport = () => {
    toast({
      title: 'Preparando paquete SCORM...',
      description: 'La descarga comenzará en breve.',
    });
    downloadCourseAsScormZip(course).catch(error => {
      console.error('Error exporting SCORM package:', error);
      toast({
        title: 'Error de Exportación',
        description: 'No se pudo generar el paquete SCORM.',
        variant: 'destructive',
      });
    });
  };

  return (
    <AlertDialog>
      <Card className="flex h-full flex-col overflow-hidden shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Link href={`/dashboard/courses/${course.id}`} className="block h-full w-full">
              <Image
                src={course.image}
                alt={course.title}
                layout="fill"
                objectFit="cover"
                data-ai-hint={course.aiHint}
              />
            </Link>
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge className="w-fit">{course.modality}</Badge>
              {isMandatory && progress < 100 && (
                <Badge variant="destructive" className="w-fit animate-pulse">
                  <AlertTriangle className="mr-1 h-3 w-3" /> Obligatorio
                </Badge>
              )}
              {canManage && course.status === 'draft' && (
                <Badge variant="outline" className="w-fit bg-background/80">
                  <Pencil className="mr-1 h-3 w-3" /> Borrador
                </Badge>
              )}
            </div>
            {canManage && (
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/courses/${course.id}/edit`}>
                        <FilePenLine className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleScormExport}>
                      <Archive className="mr-2 h-4 w-4" />
                      <span>Exportar a SCORM</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4">
          <CardTitle className="mb-2 text-lg font-semibold">{course.title}</CardTitle>
          <CardDescription className="flex-grow text-sm text-muted-foreground">
            {course.description}
          </CardDescription>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{course.modules.length} Módulos</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4 pt-0">
          <div className="w-full">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} aria-label={`${progress}% completado`} />
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/dashboard/courses/${course.id}`}>Ver Curso</Link>
          </Button>
        </CardFooter>
      </Card>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de que quieres eliminar este curso?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el curso "
            {course.title}" y todas las inscripciones y datos de progreso asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
CourseCard.displayName = 'CourseCard';
