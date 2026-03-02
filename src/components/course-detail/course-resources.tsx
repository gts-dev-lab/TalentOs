'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, Book, File, Video, Link as LinkIcon } from 'lucide-react';
import * as db from '@/lib/db';
import type { ResourceType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const resourceTypeIcons: Record<ResourceType, React.ElementType> = {
  pdf: File,
  document: File,
  link: LinkIcon,
  video: Video,
};

export function CourseResources({ courseId }: { courseId: string }) {
  const resources = useLiveQuery(() => db.getResourcesForCourse(courseId), [courseId]);

  if (resources === undefined) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Recursos de Apoyo</CardTitle>
        <CardDescription>Materiales de estudio y enlaces de interés para el curso.</CardDescription>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Book className="mx-auto h-12 w-12" />
            <p className="mt-4">No hay recursos disponibles para este curso.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map(resource => {
              const Icon = resourceTypeIcons[resource.type];
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={resource.type !== 'link' ? resource.name : undefined}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <div className="flex-grow">
                    <h3 className="font-semibold">{resource.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
