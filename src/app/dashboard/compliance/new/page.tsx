'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import { roles, departments } from '@/lib/data';
import type { RegulationType, Role, Department, Course } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const regulationTypes: RegulationType[] = ['ISO', 'PRL', 'GDPR', 'LOPD', 'Ley', 'Normativa', 'Certificación', 'Otro'];

const regulationSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  type: z.enum(regulationTypes as [string, ...string[]], { required_error: 'Debes seleccionar un tipo' }),
  applicableRoles: z.array(z.string()).min(1, 'Debes seleccionar al menos un rol'),
  applicableDepartments: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional(),
  validityPeriod: z.number().optional(),
  requiresRenewal: z.boolean(),
  renewalPeriod: z.number().optional(),
  isActive: z.boolean(),
}).refine(data => {
  if (data.requiresRenewal && !data.validityPeriod) {
    return false;
  }
  return true;
}, {
  message: 'Si requiere renovación, debes especificar el período de validez',
  path: ['validityPeriod'],
});

type RegulationFormValues = z.infer<typeof regulationSchema>;

export default function NewRegulationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);

  const [courseOpen, setCourseOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);

  const form = useForm<RegulationFormValues>({
    resolver: zodResolver(regulationSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: undefined,
      applicableRoles: [],
      applicableDepartments: [],
      courseIds: [],
      validityPeriod: undefined,
      requiresRenewal: false,
      renewalPeriod: undefined,
      isActive: true,
    },
  });

  const isManager = user && ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);

  if (!isManager) {
    router.push('/dashboard/compliance');
    return null;
  }

  const selectedCourseIds = form.watch('courseIds');
  const selectedCourses = (allCourses || []).filter(c => selectedCourseIds?.includes(c.id));
  const selectedRoles = form.watch('applicableRoles') || [];
  const selectedDepartments = form.watch('applicableDepartments') || [];

  const onSubmit = async (data: RegulationFormValues) => {
    try {
      await db.addRegulation({
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        type: data.type as any,
        applicableRoles: data.applicableRoles as Role[],
        applicableDepartments: data.applicableDepartments && data.applicableDepartments.length > 0 ? data.applicableDepartments as Department[] : undefined,
        courseIds: data.courseIds || [],
        validityPeriod: data.validityPeriod,
        requiresRenewal: data.requiresRenewal,
        renewalPeriod: data.renewalPeriod,
        isActive: data.isActive,
      });
      toast({ title: 'Normativa Creada', description: 'La normativa ha sido creada exitosamente.' });
      router.push('/dashboard/compliance');
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo crear la normativa.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/compliance">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Compliance
        </Link>
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Crear Nueva Normativa</CardTitle>
          <CardDescription>Registra una nueva normativa o regulación que debe cumplirse en la organización</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de la Normativa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: ISO 9001:2015, RD 39/1997" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regulationTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Normativa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Sistemas de Gestión de la Calidad" {...field} />
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
                      <Textarea placeholder="Describe la normativa y sus requisitos..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Roles Aplicables</Label>
                <Popover open={rolesOpen} onOpenChange={setRolesOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {selectedRoles.length > 0 ? `${selectedRoles.length} roles seleccionados` : 'Selecciona roles'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar rol..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron roles.</CommandEmpty>
                        <CommandGroup>
                          {roles.map((role) => {
                            const isSelected = selectedRoles.includes(role);
                            return (
                              <CommandItem
                                key={role}
                                onSelect={() => {
                                  const current = form.getValues('applicableRoles') || [];
                                  if (isSelected) {
                                    form.setValue('applicableRoles', current.filter(r => r !== role));
                                  } else {
                                    form.setValue('applicableRoles', [...current, role]);
                                  }
                                }}
                              >
                                <div className={cn('mr-2 h-4 w-4 border rounded', isSelected && 'bg-primary')} />
                                {role}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue('applicableRoles', selectedRoles.filter(r => r !== role));
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {form.formState.errors.applicableRoles && (
                  <p className="text-sm text-destructive">{form.formState.errors.applicableRoles.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Departamentos Aplicables (opcional)</Label>
                <Popover open={departmentsOpen} onOpenChange={setDepartmentsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {selectedDepartments.length > 0 ? `${selectedDepartments.length} departamentos seleccionados` : 'Selecciona departamentos (opcional)'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar departamento..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron departamentos.</CommandEmpty>
                        <CommandGroup>
                          {departments.map((dept) => {
                            const isSelected = selectedDepartments.includes(dept);
                            return (
                              <CommandItem
                                key={dept}
                                onSelect={() => {
                                  const current = form.getValues('applicableDepartments') || [];
                                  if (isSelected) {
                                    form.setValue('applicableDepartments', current.filter(d => d !== dept));
                                  } else {
                                    form.setValue('applicableDepartments', [...current, dept]);
                                  }
                                }}
                              >
                                <div className={cn('mr-2 h-4 w-4 border rounded', isSelected && 'bg-primary')} />
                                {dept}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDepartments.map((dept) => (
                      <Badge key={dept} variant="secondary">
                        {dept}
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue('applicableDepartments', selectedDepartments.filter(d => d !== dept));
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Cursos Asociados (opcional)</Label>
                <Popover open={courseOpen} onOpenChange={setCourseOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {selectedCourses.length > 0 ? `${selectedCourses.length} cursos seleccionados` : 'Selecciona cursos (opcional)'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar curso..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron cursos.</CommandEmpty>
                        <CommandGroup>
                          {(allCourses || []).map((course) => {
                            const isSelected = selectedCourseIds?.includes(course.id);
                            return (
                              <CommandItem
                                key={course.id}
                                onSelect={() => {
                                  const current = form.getValues('courseIds') || [];
                                  if (isSelected) {
                                    form.setValue('courseIds', current.filter(id => id !== course.id));
                                  } else {
                                    form.setValue('courseIds', [...current, course.id]);
                                  }
                                }}
                              >
                                <div className={cn('mr-2 h-4 w-4 border rounded', isSelected && 'bg-primary')} />
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
                    {selectedCourses.map((course) => (
                      <Badge key={course.id} variant="secondary">
                        {course.title}
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue('courseIds', selectedCourseIds?.filter(id => id !== course.id) || []);
                          }}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="requiresRenewal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requiere Renovación Periódica</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('requiresRenewal') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="validityPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Período de Validez (meses)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Ej: 24"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="renewalPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Período de Renovación (meses, opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Ej: 12"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Normativa Activa</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Las normativas inactivas no se mostrarán en los reportes de cumplimiento
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/compliance">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Normativa
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
