'use client';

import Link from 'next/link';
import { ArrowLeft, Edit, Sparkles, Upload } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import type { AIConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateCourseHubPage() {
  const aiConfig = useLiveQuery<AIConfig | undefined>(() => db.getAIConfig());

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/courses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Catálogo
        </Link>
      </Button>

      <div className="text-center">
        <h1 className="text-3xl font-bold">Crear un Nuevo Curso</h1>
        <p className="text-muted-foreground mt-2">
          Elige cómo quieres empezar a construir tu próxima formación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <Link href="/dashboard/courses/new" className="block">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-2">
                <Edit className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Creación Manual</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Completa un formulario detallado para crear un curso desde cero. Control total sobre
                cada aspecto de la formación.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {aiConfig?.enabledFeatures.courseGeneration && (
          <Link href="/dashboard/courses/ai-generator" className="block">
            <Card className="h-full hover:border-primary hover:shadow-lg transition-all">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Generador con IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Describe un tema y deja que la inteligencia artificial genere una estructura de
                  curso completa, incluyendo módulos y descripciones.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/courses/scorm-import" className="block">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-2">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Importar SCORM</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Sube un paquete SCORM (.zip) existente y la plataforma creará automáticamente la
                estructura del curso por ti.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
