// @ts-nocheck

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm, Controller } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, FilePenLine, Trash2 } from 'lucide-react';
import * as db from '@/lib/db';
import type { User, ExternalTraining, ExternalTrainingType } from '@/lib/types';
import { externalTrainingTypes } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/auth';

const externalTrainingSchema = z.object({
  title: z.string().min(3, 'El título es obligatorio.'),
  type: z.enum(externalTrainingTypes as [string, ...string[]], {
    required_error: 'Debes seleccionar un tipo.',
  }),
  institution: z.string().min(2, 'La entidad es obligatoria.'),
  endDate: z
    .string()
    .refine(val => !val || !isNaN(parseISO(val).getTime()), { message: 'Fecha inválida.' }),
  fileUrl: z.string().url('Debe ser una URL válida.').optional().or(z.literal('')),
  comments: z.string().optional(),
});

type ExternalTrainingFormValues = z.infer<typeof externalTrainingSchema>;

function ExternalTrainingDialog({
  open,
  onOpenChange,
  training,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training: ExternalTraining | null;
  userId: string;
}) {
  const { toast } = useToast();
  const form = useForm<ExternalTrainingFormValues>({
    resolver: zodResolver(externalTrainingSchema),
    defaultValues: {
      title: '',
      type: undefined,
      institution: '',
      endDate: '',
      fileUrl: '',
      comments: '',
    },
  });

  useEffect(() => {
    if (training) {
      form.reset({
        title: training.title || '',
        type: training.type,
        institution: training.institution || '',
        endDate: training.endDate ? format(parseISO(training.endDate), 'yyyy-MM-dd') : '',
        fileUrl: training.fileUrl || '',
        comments: training.comments || '',
      });
    } else {
      form.reset({
        title: '',
        type: undefined,
        institution: '',
        endDate: '',
        fileUrl: '',
        comments: '',
      });
    }
  }, [training, form]);

  const onSubmit = async (data: ExternalTrainingFormValues) => {
    try {
      const payload: Omit<ExternalTraining, 'id'> = {
        userId,
        ...data,
        endDate: data.endDate || undefined,
      };

      if (training?.id) {
        await db.updateExternalTraining(training.id, payload);
        toast({ title: 'Formación actualizada' });
      } else {
        await db.addExternalTraining(payload);
        toast({ title: 'Formación añadida' });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save external training', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la formación.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{training ? 'Editar' : 'Añadir'} Formación Externa</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form id="et-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {externalTrainingTypes.map(t => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entidad</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Fin</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Certificado</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="et-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExternalTrainingSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const trainings = useLiveQuery(
    () => (user ? db.getExternalTrainingsForUser(user.id) : []),
    [user?.id]
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<ExternalTraining | null>(null);
  const [trainingToDelete, setTrainingToDelete] = useState<ExternalTraining | null>(null);

  const handleEdit = useCallback((training: ExternalTraining) => {
    setSelectedTraining(training);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!trainingToDelete?.id) return;
    try {
      await db.deleteExternalTraining(trainingToDelete.id);
      toast({ title: 'Formación eliminada' });
    } catch (error) {
      console.error('Failed to delete training', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la formación.',
        variant: 'destructive',
      });
    } finally {
      setTrainingToDelete(null);
    }
  }, [trainingToDelete, toast]);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AlertDialog>
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Formación Externa</h3>
            <p className="text-sm text-muted-foreground">
              Registra y gestiona tus cursos y certificaciones externas.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedTraining(null);
              setIsDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Formación
          </Button>
        </div>

        {trainings === undefined ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : trainings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No has registrado ninguna formación externa.
          </p>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{t.institution}</TableCell>
                    <TableCell>
                      {t.endDate ? format(parseISO(t.endDate), 'MMM yyyy') : 'En curso'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setTrainingToDelete(t)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ExternalTrainingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        training={selectedTraining}
        userId={user.id}
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará el registro de formación externa "{trainingToDelete?.title}". Esta
            acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
