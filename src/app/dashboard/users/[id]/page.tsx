'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, BookCheck, Award, Star, Loader2 } from 'lucide-react';
import * as db from '@/lib/db';
import type { User, Course, Badge as BadgeType } from '@/lib/types';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as LucideIcons from 'lucide-react';
import { useMemo } from 'react';

const DynamicIcon = ({ name }: { name: string }) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <Star />;
  return <Icon />;
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const user = useLiveQuery(() => db.getUserById(userId), [userId]);
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);
  const userProgress = useLiveQuery(() => db.getUserProgressForUser(userId), [userId]);
  const userBadges = useLiveQuery(() => db.getBadgesForUser(userId), [userId], []);
  const allBadges = useLiveQuery(() => db.getAllBadges(), [], []);

  const completedCourses = useMemo(() => {
    if (!userProgress || !allCourses) return [];
    const courseModuleCounts = new Map(allCourses.map(c => [c.id, c.modules.length]));

    return userProgress
      .filter(p => {
        const totalModules = courseModuleCounts.get(p.courseId) || 0;
        return totalModules > 0 && p.completedModules.length === totalModules;
      })
      .map(p => allCourses.find(c => c.id === p.courseId))
      .filter(Boolean) as Course[];
  }, [userProgress, allCourses]);

  const earnedBadges = useMemo(() => {
    if (!userBadges || !allBadges) return [];
    const userBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
    return allBadges.filter(b => userBadgeIds.has(b.id));
  }, [userBadges, allBadges]);

  if (!user || !allCourses || userProgress === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Usuarios
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl">{user.name}</CardTitle>
            <CardDescription>
              {user.role} en el departamento de {user.department}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Puntos de Experiencia" value={user.points.toString()} icon={Award} />
        <StatCard
          title="Cursos Completados"
          value={completedCourses.length.toString()}
          icon={BookCheck}
        />
        <StatCard title="Insignias Obtenidas" value={earnedBadges.length.toString()} icon={Star} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead className="text-right">Modalidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedCourses.length > 0 ? (
                    completedCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
                        <TableCell className="text-right">{course.modality}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        Este usuario no ha completado ningún curso.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Insignias Obtenidas</CardTitle>
            </CardHeader>
            <CardContent>
              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {earnedBadges.map(badge => (
                    <TooltipProvider key={badge.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 text-center p-2 border rounded-lg bg-green-50 border-green-200">
                            <div className="p-2 bg-green-100 rounded-full">
                              <DynamicIcon name={badge.icon} />
                            </div>
                            <p className="font-semibold text-xs">{badge.name}</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{badge.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Este usuario no ha ganado insignias.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
