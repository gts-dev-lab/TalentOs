'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Loader2, Plus, X, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { Course, PDIStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const pdiSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  objectives: z
    .array(z.object({ value: z.string().min(1, 'El objetivo no puede estar vacío') }))
    .min(1, 'Debes añadir al menos un objetivo'),
  courseIds: z.array(z.string()).min(1, 'Debes seleccionar al menos un curso'),
  startDate: z.string().min(1, 'Debes seleccionar una fecha de inicio'),
  endDate: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
});

type PDIFormValues = z.infer<typeof pdiSchema>;

export default function EditPDIPage() {
  const router = useRouter();
  const params = useParams();
  const pdiId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);

  const [initialLoading, setInitialLoading] = useState(true);
  const [courseOpen, setCourseOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<PDIFormValues>({
    resolver: zodResolver(pdiSchema),
    defaultValues: {
      title: '',
      description: '',
      objectives: [{ value: '' }],
      courseIds: [],
      startDate: '',
      endDate: '',
      status: 'draft',
    },
  });

  const {
    fields: objectiveFields,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({
    control: form.control,
    name: 'objectives',
  });

  useEffect(() => {
    if (pdiId && allCourses) {
      db.getPDIById(pdiId).then(pdi => {
        if (pdi) {
          if (pdi.managerId !== user?.id && user?.role !== 'Administrador General') {
            toast({
              title: 'No autorizado',
              description: 'No tienes permisos para editar este PDI.',
              variant: 'destructive',
            });
            router.push(`/dashboard/pdi/${pdiId}`);
            return;
          }
          form.reset({
            title: pdi.title,
            description: pdi.description || '',
            objectives: pdi.objectives.map(obj => ({ value: obj })),
            courseIds: pdi.courseIds,
            startDate: pdi.startDate.split('T')[0],
            endDate: pdi.endDate ? pdi.endDate.split('T')[0] : '',
            status: pdi.status,
          });
        } else {
          toast({ title: 'Error', description: 'PDI no encontrado.', variant: 'destructive' });
          router.push('/dashboard/pdi');
        }
        setInitialLoading(false);
      });
    }
  }, [pdiId, allCourses, form, router, toast, user]);

  const selectedCourseIds = form.watch('courseIds');
  const selectedCourses = (allCourses || []).filter(c => selectedCourseIds.includes(c.id));

  if (initialLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const onSubmit = async (data: PDIFormValues) => {
    if (!pdiId) return;
    try {
      await db.updatePDI(pdiId, {
        title: data.title,
        description: data.description || '',
        objectives: data.objectives.map(o => o.value),
        courseIds: data.courseIds,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        status: data.status,
      });
      toast({
        title: 'PDI Actualizado',
        description: 'Los cambios han sido guardados exitosamente.',
      });
      router.push(`/dashboard/pdi/${pdiId}`);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el PDI.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/pdi/${pdiId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al PDI
        </Link>
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Editar Plan de Desarrollo Individual</CardTitle>
          <CardDescription>Modifica los detalles del plan de desarrollo</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del PDI</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Plan de Desarrollo 2026 - Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe los objetivos generales del plan..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Objetivos de Desarrollo</Label>
                {objectiveFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`objectives.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder={`Objetivo ${index + 1}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {objectiveFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeObjective(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendObjective({ value: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir Objetivo
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Cursos Asignados</Label>
                <Popover open={courseOpen} onOpenChange={setCourseOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {selectedCourses.length > 0
                        ? `${selectedCourses.length} cursos seleccionados`
                        : 'Selecciona cursos'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar curso..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron cursos.</CommandEmpty>
                        <CommandGroup>
                          {(allCourses || []).map(course => {
                            const isSelected = selectedCourseIds.includes(course.id);
                            return (
                              <CommandItem
                                key={course.id}
                                onSelect={() => {
                                  const current = form.getValues('courseIds');
                                  if (isSelected) {
                                    form.setValue(
                                      'courseIds',
                                      current.filter(id => id !== course.id)
                                    );
                                  } else {
                                    form.setValue('courseIds', [...current, course.id]);
                                  }
                                }}
                              >
                                <div
                                  className={cn(
                                    'mr-2 h-4 w-4 border rounded',
                                    isSelected && 'bg-primary'
                                  )}
                                />
                                {course.title}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedCourses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCourses.map(course => (
                      <Badge key={course.id} variant="secondary">
                        {course.title}
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue(
                              'courseIds',
                              selectedCourseIds.filter(id => id !== course.id)
                            );
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {form.formState.errors.courseIds && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.courseIds.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), 'PPP', { locale: es })
                                : 'Selecciona fecha'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={date => {
                              field.onChange(date ? date.toISOString().split('T')[0] : '');
                              setStartDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Fin (opcional)</FormLabel>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(new Date(field.value), 'PPP', { locale: es })
                                : 'Selecciona fecha'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={date => {
                              field.onChange(date ? date.toISOString().split('T')[0] : '');
                              setEndDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={`/dashboard/pdi/${pdiId}`}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
