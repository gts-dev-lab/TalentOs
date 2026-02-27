// @ts-nocheck

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import { roles, departments } from '@/lib/data';
import type { Role, Department } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const editUserFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  role: z.enum(roles as [string, ...string[]], { errorMap: () => ({ message: "Debes seleccionar un rol." }) }),
  department: z.enum(departments as [string, ...string[]], { errorMap: () => ({ message: "Debes seleccionar un departamento." }) }),
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const userId = params.id as string;
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: undefined,
      department: undefined,
    },
  });
  
  const { isSubmitting, isDirty } = form.formState;

  useEffect(() => {
    if (userId) {
      db.getUserById(userId)
        .then(data => {
          if (data) {
            form.reset({
                name: data.name,
                email: data.email,
                role: data.role,
                department: data.department
            });
          } else {
            toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
            router.push('/dashboard/users');
          }
        })
    }
  }, [userId, router, toast, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    try {
        await db.updateUser(userId, { ...data, role: data.role as any });
        toast({
            title: "Usuario Actualizado",
            description: "Los datos del usuario han sido guardados.",
        });
        router.push('/dashboard/users');
    } catch (error: any) {
        console.error("Failed to update user", error);
        if (error.name === 'ConstraintError') {
            form.setError("email", { type: "manual", message: "Este correo electrónico ya está en uso." });
        } else {
            toast({
                title: "Error al Guardar",
                description: "No se pudo actualizar el usuario.",
                variant: "destructive",
            });
        }
    }
  };

  if (form.formState.isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Usuarios
            </Link>
        </Button>
      
        <div className="flex justify-center">
            <Card className="w-full max-w-3xl">
                <CardHeader>
                <CardTitle>Editar Usuario</CardTitle>
                <CardDescription>Modifica los datos del miembro de la organización.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Completo</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo Electrónico</FormLabel>
                                        <FormControl>
                                            <Input type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rol</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Departamento</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            La contraseña no se puede cambiar desde este formulario.
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
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
