
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, PlusCircle, Edit, Trash2, Link2, X, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import type { Course, Module, Resource } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { roles } from '@/lib/data';

const courseFormSchema = z.object({
  title: z.string().min(2, { message: "El título debe tener al menos 2 caracteres." }),
  description: z.string().min(10, { message: "La descripción corta debe tener al menos 10 caracteres." }),
  longDescription: z.string().min(20, { message: "La descripción larga debe tener al menos 20 caracteres." }),
  instructor: z.string().min(2, { message: "El nombre del instructor debe tener al menos 2 caracteres." }),
  duration: z.string().min(1, { message: "La duración es obligatoria." }),
  modality: z.enum(['Online', 'Presencial', 'Mixta'], { errorMap: () => ({ message: "Debes seleccionar una modalidad." }) }),
  capacity: z.coerce.number().int().optional().transform(v => v === 0 ? undefined : v),
  image: z.string(), // Can be URL or Data URL
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  mandatoryForRoles: z.array(z.string()).optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// --- Module Dialog Component ---
function ModuleDialog({
  open,
  onOpenChange,
  onSave,
  module,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Module, 'id'>) => void;
  module: Omit<Module, 'id'> | Module | null;
}) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDuration(module.duration);
      setContent(module.content);
    } else {
      setTitle('');
      setDuration('');
      setContent('');
    }
  }, [module]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration || !content) return;
    onSave({ title, duration, content });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{module ? 'Editar Módulo' : 'Añadir Nuevo Módulo'}</DialogTitle>
        </DialogHeader>
        <form id="module-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="module-title">Título del Módulo</Label>
            <Input id="module-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-duration">Duración</Label>
            <Input id="module-duration" value={duration} onChange={(e) => setDuration(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-content">Contenido</Label>
            <Textarea id="module-content" value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
          <Button type="submit" form="module-form">Guardar Módulo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Associate Resource Dialog ---
function AssociateResourceDialog({
  open,
  onOpenChange,
  courseId,
  associatedResourceIds,
  onAssociationChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  associatedResourceIds: number[];
  onAssociationChange: () => void;
}) {
    const allResources = useLiveQuery(() => db.getAllResources(), []);
    const [selected, setSelected] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const initialSelection = associatedResourceIds.reduce((acc, id) => {
            acc[id] = true;
            return acc;
        }, {} as Record<number, boolean>);
        setSelected(initialSelection);
    }, [associatedResourceIds]);
    
    const handleSave = async () => {
        if (!allResources) return;
        for (const resource of allResources) {
            const isAssociated = associatedResourceIds.includes(resource.id!);
            const isSelected = selected[resource.id!];
            
            if(isSelected && !isAssociated) {
                await db.associateResourceWithCourse(courseId, resource.id!);
            } else if (!isSelected && isAssociated) {
                await db.dissociateResourceFromCourse(courseId, resource.id!);
            }
        }
        onAssociationChange();
        onOpenChange(false);
    }
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asociar Recursos</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-96 overflow-y-auto">
            {allResources?.map(resource => (
                <div key={resource.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`res-${resource.id}`}
                        checked={selected[resource.id!] ?? false}
                        onCheckedChange={(checked) => setSelected(prev => ({...prev, [resource.id!]: !!checked}))}
                    />
                    <Label htmlFor={`res-${resource.id}`} className="font-normal">{resource.name}</Label>
                </div>
            ))}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSave}>Guardar Asociaciones</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const courseId = params.id as string;
  
  // --- Modules State ---
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesDirty, setModulesDirty] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  // --- Resources State ---
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const associatedResources = useLiveQuery(() => db.getResourcesForCourse(courseId), [courseId]);
  const associatedResourceIds = useLiveQuery(() => db.getAssociatedResourceIdsForCourse(courseId), [courseId], []);

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
    }
  });
  
  const { isSubmitting, isDirty, isLoading } = form.formState;

  const imageValue = form.watch('image');

  useEffect(() => {
    if (courseId) {
      db.getCourseById(courseId)
        .then(data => {
          if (data) {
            form.reset(data);
            setModules(data.modules || []);
          } else {
            toast({ title: "Error", description: "Curso no encontrado.", variant: "destructive" });
            router.push('/dashboard/courses');
          }
        })
    }
  }, [courseId, router, toast, form]);

  const onSubmit = async (data: CourseFormValues) => {
    try {
        const courseData = {
          ...data,
          modules: modules, // Include the modules in the save data
          aiHint: data.title.toLowerCase().split(' ').slice(0, 2).join(' '),
          mandatoryForRoles: data.mandatoryForRoles as any,
        };
        await db.updateCourse(courseId, courseData);
        toast({
            title: "Curso Actualizado",
            description: "Los datos del curso han sido guardados.",
        });
        router.push(`/dashboard/courses/${courseId}`);
    } catch (error) {
        console.error("Failed to update course", error);
        toast({
            title: "Error al Guardar",
            description: "No se pudo actualizar el curso.",
            variant: "destructive",
        });
    }
  };

  const handleSaveModule = (moduleData: Omit<Module, 'id'>) => {
    if (currentModule) {
      setModules(modules.map(m => m.id === currentModule.id ? { ...currentModule, ...moduleData } : m));
    } else {
      const newModule: Module = { id: `mod_${Date.now()}`, ...moduleData };
      setModules([...modules, newModule]);
    }
    setModulesDirty(true);
    setIsModuleDialogOpen(false);
    setCurrentModule(null);
  };

  const handleOpenModuleDialog = (module: Module | null) => {
    setCurrentModule(module);
    setIsModuleDialogOpen(true);
  };

  const handleDeleteModule = () => {
    if (moduleToDelete) {
      setModules(modules.filter(m => m.id !== moduleToDelete.id));
      setModulesDirty(true);
      setModuleToDelete(null);
    }
  };

  const handleDissociateResource = async (resourceId: number) => {
    await db.dissociateResourceFromCourse(courseId, resourceId);
    toast({ title: 'Recurso desvinculado' });
  };


  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Curso
            </Link>
        </Button>
      
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                    <CardTitle>Gestionar Información del Curso</CardTitle>
                    <CardDescription>Aquí puedes modificar los detalles generales de la formación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Curso</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Corta</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="longDescription" render={({ field }) => (<FormItem><FormLabel>Descripción Larga</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="instructor" render={({ field }) => (<FormItem><FormLabel>Instructor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duración</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Inicio</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                {...field}
                                                value={field.value ? field.value.slice(0, 16) : ''}
                                                onChange={(e) => field.onChange(e.target.value || undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="endDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Fin</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                {...field}
                                                value={field.value ? field.value.slice(0, 16) : ''}
                                                onChange={(e) => field.onChange(e.target.value || undefined)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="modality" render={({ field }) => (<FormItem><FormLabel>Modalidad</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Online">Online</SelectItem><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Mixta">Mixta</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
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
                                    {imageValue && (
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
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </div>
            
            <div className="xl:col-span-1 space-y-8">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Módulos del Curso</CardTitle>
                                <CardDescription>Añade los temas y lecciones aquí.</CardDescription>
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenModuleDialog(null)} aria-label="Añadir módulo">
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {modules.length > 0 ? (
                                modules.map(module => (
                                    <div key={module.id} className="flex items-center justify-between p-2 pr-1 border rounded-lg bg-muted/50 text-sm">
                                        <p className="font-medium truncate flex-grow" title={module.title}>{module.title}</p>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenModuleDialog(module)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setModuleToDelete(module)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-4 text-sm border-2 border-dashed rounded-lg">
                                  <p className="font-semibold">¡Añade el primer módulo!</p>
                                  <p>Usa el botón '+' para empezar a construir el curso.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Recursos del Curso</CardTitle>
                                <CardDescription>Asocia PDFs, vídeos o enlaces.</CardDescription>
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsResourceDialogOpen(true)} aria-label="Asociar recursos">
                                <Link2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {associatedResources && associatedResources.length > 0 ? (
                                associatedResources.map(resource => (
                                    <div key={resource.id} className="flex items-center justify-between p-2 pr-1 border rounded-lg bg-muted/50 text-sm">
                                        <p className="font-medium truncate flex-grow" title={resource.name}>{resource.name}</p>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDissociateResource(resource.id!)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-4 text-sm border-2 border-dashed rounded-lg">
                                  <p className="font-semibold">Asocia el primer recurso.</p>
                                  <p>Usa el botón del enlace para añadir material de apoyo.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
        </div>

        <div className="flex justify-end pt-4">
            <Button type="button" onClick={form.handleSubmit(onSubmit)} size="lg" disabled={isSubmitting || (!isDirty && !modulesDirty)}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
            </Button>
        </div>

        <ModuleDialog
            open={isModuleDialogOpen}
            onOpenChange={setIsModuleDialogOpen}
            onSave={handleSaveModule}
            module={currentModule}
        />
        
        <AssociateResourceDialog
            open={isResourceDialogOpen}
            onOpenChange={setIsResourceDialogOpen}
            courseId={courseId}
            associatedResourceIds={associatedResourceIds}
            onAssociationChange={() => { /* LiveQuery will handle update */ }}
        />
        
        <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && setModuleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Seguro que quieres eliminar este módulo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el módulo "{moduleToDelete?.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModuleToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
