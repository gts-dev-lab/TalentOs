'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, BookCopy, Loader2, MessageSquare, BarChart2 } from 'lucide-react';
import * as db from '@/lib/db';
import type { User, Course } from '@/lib/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';

interface InstructorCardProps {
  instructor: User;
  assignedCourses: Course[];
  currentUser: User;
}

export function InstructorCard({ instructor, assignedCourses, currentUser }: InstructorCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Simulate an average rating for demo purposes
  const simulatedRating = (4.0 + (instructor.id.charCodeAt(5) % 10) / 10).toFixed(1);

  const handleSendMessage = async () => {
    setIsCreatingChat(true);
    try {
      const channel = await db.getOrCreateDirectMessageThread(currentUser.id, instructor.id);
      router.push(`/dashboard/chat?channelId=${channel.id}`);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo iniciar el chat.', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={instructor.avatar} alt={instructor.name} />
            <AvatarFallback>{instructor.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{instructor.name}</CardTitle>
            <CardDescription>{instructor.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg border p-3">
            <BookCopy className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-1 text-2xl font-bold">{assignedCourses.length}</p>
            <p className="text-xs text-muted-foreground">Cursos Impartidos</p>
          </div>
          <div className="rounded-lg border p-3">
            <Award className="mx-auto h-6 w-6 text-amber-500" />
            <p className="mt-1 text-2xl font-bold">{simulatedRating}</p>
            <p className="text-xs text-muted-foreground">Valoración Media</p>
          </div>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Cursos Asignados:</h4>
          {assignedCourses.length > 0 ? (
            <ScrollArea className="h-24">
              <div className="flex flex-wrap gap-2">
                {assignedCourses.map(course => (
                  <Badge key={course.id} variant="secondary">
                    {course.title}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no tiene cursos asignados.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/instructors/${instructor.id}/analytics`}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Ver Analíticas
          </Link>
        </Button>
        <Button size="sm" onClick={handleSendMessage} disabled={isCreatingChat}>
          {isCreatingChat ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="mr-2 h-4 w-4" />
          )}
          Enviar Mensaje
        </Button>
      </CardFooter>
    </Card>
  );
}
