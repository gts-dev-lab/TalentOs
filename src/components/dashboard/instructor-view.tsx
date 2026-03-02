'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Calendar, GraduationCap, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import * as db from '@/lib/db';
import type { User, Enrollment, UserProgress } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { StatCard } from '../stat-card';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { Button } from '../ui/button';

export function InstructorDashboardView({ user }: { user: User }) {
  // 1. Fetch all data needed for calculations in parallel using useLiveQuery
  const data = useLiveQuery(
    async () => {
      const courses = await db.getCoursesByInstructorName(user.name);
      if (courses.length === 0) {
        return { courses: [], enrollments: [], progresses: [] };
      }

      const courseIds = courses.map(c => c.id);

      const enrollments = await db.db.enrollments
        .where('courseId')
        .anyOf(courseIds)
        .and(e => e.status === 'approved' || e.status === 'active')
        .toArray();

      const studentIds = [...new Set(enrollments.map(e => e.studentId))];

      const progresses = await db.db.userProgress
        .where('courseId')
        .anyOf(courseIds)
        .and(p => studentIds.includes(p.userId))
        .toArray();

      return { courses, enrollments, progresses };
    },
    [user.name],
    { courses: undefined, enrollments: [], progresses: [] }
  );

  const stats = useMemo(() => {
    if (!data.courses) return null;

    const { courses, enrollments, progresses } = data;

    // Calculate total unique students
    const totalUniqueStudents = new Set(enrollments.map(e => e.studentId)).size;

    // Create maps for efficient lookups
    const progressMap = new Map<string, UserProgress>();
    progresses.forEach(p => progressMap.set(`${p.userId}-${p.courseId}`, p));

    const enrollmentsByCourse = new Map<string, Enrollment[]>();
    enrollments.forEach(e => {
      if (!enrollmentsByCourse.has(e.courseId)) {
        enrollmentsByCourse.set(e.courseId, []);
      }
      enrollmentsByCourse.get(e.courseId)!.push(e);
    });

    // Calculate stats for each course
    const courseStats = courses.map(course => {
      const courseEnrollments = enrollmentsByCourse.get(course.id) || [];
      const studentCount = courseEnrollments.length;

      let totalProgress = 0;
      if (studentCount > 0) {
        const courseStudentIds = courseEnrollments.map(e => e.studentId);
        courseStudentIds.forEach(studentId => {
          const progress = progressMap.get(`${studentId}-${course.id}`);
          const moduleCount = course.modules?.length || 0;
          if (progress && moduleCount > 0) {
            totalProgress += (progress.completedModules.length / moduleCount) * 100;
          }
        });
      }
      const averageProgress = studentCount > 0 ? totalProgress / studentCount : 0;

      return {
        ...course, // include all course properties
        studentCount,
        averageProgress,
      };
    });

    return {
      totalCourses: courses.length,
      totalUniqueStudents,
      courseStats,
    };
  }, [data]);

  if (!stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Panel del Formador</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user.name}. Aquí tienes un resumen de tu actividad docente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Cursos Asignados" value={stats.totalCourses.toString()} icon={BookOpen} />
        <StatCard
          title="Alumnos Totales"
          value={stats.totalUniqueStudents.toString()}
          icon={Users}
          description="En todos tus cursos"
        />
        <StatCard
          title="Próxima Clase"
          value="Mañana, 10:00"
          icon={Calendar}
          description="SVB - Aula 3"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Cursos</CardTitle>
          <CardDescription>
            Gestiona tus cursos asignados y sigue el progreso de tus alumnos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.courseStats.length > 0 ? (
            <div className="space-y-6">
              {stats.courseStats.map(course => (
                <div
                  key={course.id}
                  className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg"
                >
                  <Image
                    src={course.image}
                    alt={course.title}
                    width={180}
                    height={120}
                    className="rounded-md object-cover aspect-video"
                    data-ai-hint={course.aiHint}
                  />
                  <div className="flex-grow w-full">
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <div>
                        <p className="font-semibold">{course.studentCount}</p>
                        <p className="text-xs text-muted-foreground">Alumnos</p>
                      </div>
                      <div className="flex-grow">
                        <p className="font-semibold">Progreso Medio</p>
                        <div className="flex items-center gap-2">
                          <Progress value={course.averageProgress} className="h-2" />
                          <span className="text-xs font-semibold">
                            {course.averageProgress.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button asChild className="w-full mt-4 md:w-auto md:mt-0">
                    <Link href={`/dashboard/courses/${course.id}`}>Gestionar Curso</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="mx-auto h-12 w-12" />
              <p className="mt-4 font-semibold">No tienes cursos asignados.</p>
              <p className="text-sm">
                Contacta con un administrador para que te asigne formaciones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
