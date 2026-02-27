
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import { roles } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const courseFormSchema = z.object({
  title: z.string().min(2, { message: "El título debe tener al menos 2 caracteres." }),
  description: z.string().min(10, { message: "La descripción corta debe tener al menos 10 caracteres." }),
  longDescription: z.string().min(20, { message: "La descripción larga debe tener al menos 20 caracteres." }),
  instructor: z.string().min(2, { message: "El nombre del instructor debe tener al menos 2 caracteres." }),
  duration: z.string().min(1, { message: "La duración es obligatoria." }),
  modality: z.enum(['Online', 'Presencial', 'Mixta'], { errorMap: () => ({ message: "Debes seleccionar una modalidad." }) }),
  capacity: z.coerce.number().int().optional().transform(v => v === 0 ? undefined : v),
  image: z.string().optional().default('/images/default.png'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  mandatoryForRoles: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
        title: '',
        description: '',
        longDescription: '',
        instructor: '',
        duration: '',
        modality: undefined,
        capacity: undefined,
        image: '/images/default.png',
        startDate: '',
        endDate: '',
        mandatoryForRoles: [],
        status: 'draft',
    },
    mode: 'onChange'
  });
  
  const { isSubmitting } = form.formState;
  const imageValue = form.watch('image');

  const onSubmit = async (data: CourseFormValues) => {
    const newCourseData = {
        ...data,
        aiHint: data.title.toLowerCase().split(' ').slice(0, 2).join(' '),
        mandatoryForRoles: data.mandatoryForRoles as any,
    };

    try {
        const newCourseId = await db.addCourse(newCourseData);
        toast({
            title: "Curso creado con éxito",
            description: "Ahora puedes añadir los módulos y recursos del curso.",
        });
        router.push(`/dashboard/courses/${newCourseId}/edit`);
    } catch (error) {
        console.error("Failed to create course", error);
        toast({
            title: "Error al Guardar",
            description: "No se pudo crear el curso. Inténtalo de nuevo.",
            variant: "destructive",
        })
    }
  };

  return (
    <div className="space-y-8">
        <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/courses/create">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Opciones
            </Link>
        </Button>
      
        <div className="flex justify-center">
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle>Crear Nuevo Curso (Manual)</CardTitle>
                    <CardDescription>Completa el formulario para añadir una nueva formación al catálogo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Curso</FormLabel><FormControl><Input placeholder="Ej: Soporte Vital Avanzado" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Corta</FormLabel><FormControl><Textarea placeholder="Un resumen breve del curso para la tarjeta." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="longDescription" render={({ field }) => (<FormItem><FormLabel>Descripción Larga</FormLabel><FormControl><Textarea placeholder="Descripción detallada que aparecerá en la página del curso." rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="instructor" render={({ field }) => (<FormItem><FormLabel>Instructor</FormLabel><FormControl><Input placeholder="Ej: Dr. Alejandro Torres" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duración</FormLabel><FormControl><Input placeholder="Ej: 16 horas" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="modality" render={({ field }) => (<FormItem><FormLabel>Modalidad</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona una modalidad" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Online">Online</SelectItem><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Mixta">Mixta</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="capacity" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plazas Disponibles</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="Ilimitadas" 
                                                {...field} 
                                                onChange={e => {
                                                    const value = e.target.valueAsNumber;
                                                    field.onChange(isNaN(value) ? undefined : value);
                                                }}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormDescription>Dejar en blanco o en 0 para plazas ilimitadas.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Inicio</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="endDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Fin</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Imagen de Cabecera</FormLabel>
                                    <FormDescription>Recomendado: 1200x600px. Máx 1MB.</FormDescription>
                                    <FormControl>
                                    <Input
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            if (file.size > 1 * 1024 * 1024) {
                                                toast({ title: 'Archivo demasiado grande', description: 'La imagen no debe superar 1MB.', variant: 'destructive'});
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                field.onChange(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                        }}
                                    />
                                    </FormControl>
                                    {imageValue && imageValue !== '/images/default.png' && (
                                        <div className="mt-4 relative w-full h-48 rounded-lg overflow-hidden">
                                            <Image src={imageValue} alt="Vista previa de la imagen del curso" layout="fill" objectFit="cover" />
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="mandatoryForRoles"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Obligatorio Para (Roles)</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>
                                                        {field.value?.length ? `${field.value.length} seleccionado(s)` : "Seleccionar roles"}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <div className="p-2 space-y-1">
                                                {roles.map((role) => (
                                                    <div key={role} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                                                        <Checkbox
                                                            id={`role-${role}`}
                                                            checked={field.value?.includes(role)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), role])
                                                                    : field.onChange(field.value?.filter((value) => value !== role))
                                                            }}
                                                        />
                                                        <label htmlFor={`role-${role}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {role}
                                                        </label>
                                                    </div>
                                                ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Publicar Curso
                                            </FormLabel>
                                            <FormDescription>
                                                Si se activa, el curso será visible para todos los usuarios inmediatamente.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value === 'published'}
                                                onCheckedChange={(checked) => field.onChange(checked ? 'published' : 'draft')}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end pt-4">
                                <Button type="submit" size="lg" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear Curso
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
