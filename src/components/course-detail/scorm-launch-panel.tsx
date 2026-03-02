'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import type { Course } from '@/lib/types';

export function ScormLaunchPanel({ course }: { course: Course }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Contenido del Curso SCORM</CardTitle>
        <CardDescription>
          Este curso se imparte a través de un paquete SCORM. Haz clic a continuación para iniciar
          la experiencia de aprendizaje.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-muted-foreground">{course.longDescription}</p>
        <Button asChild size="lg" className="w-full">
          <Link href={`/dashboard/courses/${course.id}/scorm-player`}>
            <PlayCircle className="mr-2 h-5 w-5" />
            Iniciar Curso
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
