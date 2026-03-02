'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, Megaphone, Send, User, Users } from 'lucide-react';
import * as db from '@/lib/db';
import type { Course } from '@/lib/types';
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { StatusBadge } from '../enrollments/status-badge';
import { Textarea } from '../ui/textarea';
import { sendAnnouncementAction } from '@/app/dashboard/courses/actions';

export function CourseManagementTab({ course }: { course: Course }) {
  const { toast } = useToast();
  const [announcement, setAnnouncement] = useState('');
  const [isSending, setIsSending] = useState(false);

  const students = useLiveQuery(
    () => db.getStudentsForCourseManagement(course.id),
    [course.id],
    []
  );

  const handleSendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setIsSending(true);

    const result = await sendAnnouncementAction(course.id, course.title, announcement);

    if (result.success) {
      toast({ title: 'Éxito', description: result.message });
      setAnnouncement('');
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSending(false);
  };

  if (students === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            Alumnos Inscritos
          </CardTitle>
          <CardDescription>
            Lista de todos los participantes actualmente activos en este curso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[200px]">Progreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={student.progress} className="h-2" />
                        <span className="text-xs font-semibold">{student.progress}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    No hay alumnos inscritos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone />
            Crear Anuncio para el Curso
          </CardTitle>
          <CardDescription>
            Envía una notificación a todos los estudiantes inscritos en este curso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Escribe tu mensaje aquí..."
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            rows={4}
            disabled={isSending}
          />
          <div className="flex justify-end">
            <Button onClick={handleSendAnnouncement} disabled={isSending || !announcement.trim()}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Anuncio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
