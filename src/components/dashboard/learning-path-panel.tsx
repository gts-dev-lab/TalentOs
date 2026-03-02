'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { Loader2, Route, Check, Lock, PlayCircle } from 'lucide-react';
import * as db from '@/lib/db';
import type { User, Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

export function LearningPathPanel({ user }: { user: User }) {
  const learningPaths = useLiveQuery(() => db.getLearningPathsForUser(user), [user.id]);
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);

  const courseMap = useMemo(() => {
    if (!allCourses) return new Map<string, Course>();
    return new Map(allCourses.map(course => [course.id, course]));
  }, [allCourses]);

  if (learningPaths === undefined) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Planes de Carrera</CardTitle>
          <CardDescription>Tus rutas de aprendizaje asignadas.</CardDescription>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const activePaths = learningPaths.filter(path => {
    const completedIds = path.progress?.completedCourseIds || [];
    return completedIds.length < path.courseIds.length;
  });

  if (activePaths.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Planes de Carrera</CardTitle>
          <CardDescription>Tus rutas de aprendizaje asignadas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-48 items-center justify-center text-center text-muted-foreground">
          <Route className="h-12 w-12" />
          <p className="mt-4 font-semibold">¡Todo al día!</p>
          <p className="text-sm">No tienes planes de carrera pendientes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Planes de Carrera</CardTitle>
        <CardDescription>Tus rutas de aprendizaje asignadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activePaths.map(path => {
          const completedIds = new Set(path.progress?.completedCourseIds || []);
          const totalSteps = path.courseIds.length;
          const completedSteps = path.courseIds.filter(id => completedIds.has(id)).length;
          const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
          let nextCourseFound = false;

          return (
            <div key={path.id} className="space-y-4 p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{path.title}</h3>
                <Progress value={progressPercentage} className="mt-2 h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  Completados {completedSteps} de {totalSteps} cursos.
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                {path.courseIds.map((courseId, index) => {
                  const course = courseMap.get(courseId);
                  if (!course) return null;

                  let status: 'completed' | 'active' | 'locked' = 'locked';
                  if (completedIds.has(courseId)) {
                    status = 'completed';
                  } else if (!nextCourseFound) {
                    status = 'active';
                    nextCourseFound = true;
                  }

                  const Icon =
                    status === 'completed' ? Check : status === 'active' ? PlayCircle : Lock;
                  const iconColor =
                    status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : status === 'active'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground';

                  return (
                    <div key={course.id} className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full',
                          iconColor
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-grow">
                        <p
                          className={cn(
                            'font-medium',
                            status === 'locked' && 'text-muted-foreground'
                          )}
                        >
                          {course.title}
                        </p>
                        <p className="text-xs text-muted-foreground">Paso {index + 1}</p>
                      </div>
                      {status === 'active' && (
                        <Button asChild size="sm">
                          <Link href={`/dashboard/courses/${course.id}`}>Empezar</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
