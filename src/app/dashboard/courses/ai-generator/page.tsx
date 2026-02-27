
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, Wand2, CheckCircle, PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import { generateCourseFromTopic } from '@/ai/flows/generate-course-from-topic';
import type { GenerateCourseFromTopicOutput } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const generatorFormSchema = z.object({
  topic: z.string().min(5, { message: "El tema debe tener al menos 5 caracteres." }),
});

type GeneratorFormValues = z.infer<typeof generatorFormSchema>;

function GeneratedCoursePreview({ courseData, onSave }: { courseData: any, onSave: () => void }) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave();
        setIsSaving(false);
    }
    
    return (
        <Card className="w-full mt-8 border-primary shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><CheckCircle className="text-green-500" /> ¡Curso Generado!</CardTitle>
                <CardDescription>Revisa la estructura del curso generada por la IA. Puedes guardarlo como borrador para editarlo más tarde.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-primary">{courseData.title}</h2>
                    <p className="text-sm text-muted-foreground">Instructor: {courseData.instructor} | Duración: {courseData.duration} | Modalidad: {courseData.modality}</p>
                </div>
                <p className="text-base">{courseData.longDescription}</p>
                <Separator />
                <div>
                    <h3 className="text-lg font-semibold mb-2">Módulos Sugeridos</h3>
                    <div className="space-y-3">
                        {courseData.modules.map((module: any, index: number) => (
                            <div key={index} className="p-3 border rounded-lg bg-muted/50">
                                <p className="font-semibold">{index + 1}. {module.title} <span className="text-xs text-muted-foreground">({module.duration})</span></p>
                                <p className="text-sm text-muted-foreground mt-1">{module.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardContent className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Guardar como Borrador
                </Button>
            </CardContent>
        </Card>
    )
}


export default function AIGeneratorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [generatedCourse, setGeneratedCourse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorFormSchema),
    defaultValues: { topic: '' },
  });

  const onSubmit = async (data: GeneratorFormValues) => {
    setIsLoading(true);
    setGeneratedCourse(null);
    try {
        const result = await generateCourseFromTopic(data.topic);
        setGeneratedCourse(result);
    } catch (error: any) {
        console.error("Failed to generate course", error);
        const description = error.message?.includes('API no está configurada')
            ? error.message
            : "No se pudo generar el curso. Inténtalo con un tema diferente.";
        toast({
            title: "Error de la IA",
            description,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedCourse) return;
    try {
        const newCourseData = {
            ...generatedCourse,
            image: '/images/default.png',
            aiHint: generatedCourse.title.toLowerCase().split(' ').slice(0, 2).join(' '),
            modules: generatedCourse.modules.map((m: any, i: number) => ({...m, id: `mod_${Date.now()}_${i}`})),
        };
        const newCourseId = await db.addCourse(newCourseData);
        toast({
            title: "Borrador Guardado",
            description: "El curso generado por IA ha sido guardado. Ahora puedes editarlo y añadir contenido.",
        });
        router.push(`/dashboard/courses/${newCourseId}/edit`);
    } catch (error) {
        console.error("Failed to save generated course", error);
        toast({
            title: "Error al Guardar",
            description: "No se pudo guardar el borrador del curso.",
            variant: "destructive",
        });
    }
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/courses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Catálogo
        </Link>
      </Button>

      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Wand2 className="h-7 w-7 text-primary" />
                Generador de Cursos con IA
              </CardTitle>
              <CardDescription>Describe el tema del curso que necesitas y la IA creará una estructura completa, incluyendo título, descripción y módulos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Tema del curso</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Curso avanzado sobre manejo de hemorragias en trauma" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generar Estructura del Curso
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {generatedCourse && (
            <GeneratedCoursePreview courseData={generatedCourse} onSave={handleSaveDraft} />
          )}

        </div>
      </div>
    </div>
  );
}
