'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, BarChart2, BookCopy, Loader2, Star, UserCheck } from 'lucide-react';
import * as db from '@/lib/db';
import type { User } from '@/lib/types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function InstructorAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const instructorId = params.id as string;

  const instructor = useLiveQuery(() => db.getUserById(instructorId), [instructorId]);

  const data = useLiveQuery(async () => {
    if (!instructor) return null;

    const courses = await db.getCoursesByInstructorName(instructor.name);
    if (courses.length === 0) {
      return { courses: [], enrollments: [], progresses: [], ratings: [] };
    }

    const courseIds = courses.map(c => c.id);

    const enrollments = await db.db.enrollments.where('courseId').anyOf(courseIds).toArray();
    const progresses = await db.db.userProgress.where('courseId').anyOf(courseIds).toArray();
    const ratings = await db.getRatingsForInstructor(instructor.name);

    return { courses, enrollments, progresses, ratings };
  }, [instructor]);

  const stats = useMemo(() => {
    if (!instructor || !data) return null;

    const { courses, enrollments, progresses, ratings } = data;

    const totalCourses = courses.length;
    const totalRatings = ratings.length;
    const totalStudents = new Set(enrollments.map(e => e.studentId)).size;

    const overallInstructorRating =
      totalRatings > 0 ? ratings.reduce((acc, r) => acc + r.instructorRating, 0) / totalRatings : 0;

    const courseModuleCounts = new Map(courses.map(c => [c.id, c.modules?.length || 0]));

    let totalProgressSum = 0;
    let progressRecordsCount = 0;

    const courseStats = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
      const studentCount = new Set(courseEnrollments.map(e => e.studentId)).size;

      const courseRatings = ratings.filter(r => r.courseId === course.id);
      const avgRating =
        courseRatings.length > 0
          ? courseRatings.reduce((acc, r) => acc + r.rating, 0) / courseRatings.length
          : 0;

      return {
        id: course.id,
        title: course.title,
        studentCount: studentCount,
        averageRating: avgRating.toFixed(1),
      };
    });

    progresses.forEach(p => {
      const totalModules = courseModuleCounts.get(p.courseId);
      if (totalModules && totalModules > 0) {
        totalProgressSum += (p.completedModules.length / totalModules) * 100;
        progressRecordsCount++;
      }
    });

    const averageCompletion =
      progressRecordsCount > 0 ? totalProgressSum / progressRecordsCount : 0;

    return {
      totalCourses,
      totalStudents,
      overallInstructorRating: overallInstructorRating.toFixed(1),
      averageCompletion: averageCompletion.toFixed(0),
      courseStats,
      recentComments: ratings.slice(-5).reverse(),
      totalRatings,
    };
  }, [instructor, data]);

  if (!instructor || !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/instructors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Formadores
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={instructor.avatar} />
            <AvatarFallback>{instructor.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl">{instructor.name}</CardTitle>
            <CardDescription>
              {instructor.role} en el departamento de {instructor.department}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Cursos Impartidos" value={stats.totalCourses.toString()} icon={BookCopy} />
        <StatCard
          title="Valoración Media"
          value={stats.overallInstructorRating}
          icon={Star}
          description={`Basada en ${stats.totalRatings} valoraciones`}
        />
        <StatCard
          title="Alumnos Totales"
          value={stats.totalStudents.toString()}
          icon={UserCheck}
          description="Alumnos únicos en sus cursos"
        />
        <StatCard
          title="Finalización Media"
          value={`${stats.averageCompletion}%`}
          icon={BarChart2}
          description="En todos sus cursos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Desglose por Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Alumnos</TableHead>
                    <TableHead className="text-right">Valoración Media</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.courseStats.map(stat => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.title}</TableCell>
                      <TableCell>{stat.studentCount}</TableCell>
                      <TableCell className="text-right flex justify-end items-center gap-1">
                        {stat.averageRating} <Star className="h-4 w-4 text-amber-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Comentarios Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <div className="space-y-4">
                  {stats.recentComments.length > 0 ? (
                    stats.recentComments.map(comment => (
                      <div key={comment.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback>{comment.userName.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{comment.userName}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < comment.instructorRating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{comment.comment}"</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      Este formador aún no ha recibido comentarios.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
