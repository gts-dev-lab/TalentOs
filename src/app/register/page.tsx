// @ts-nocheck

'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roles } from '@/lib/data';
import type { Role } from '@/lib/types';

const authentikEnabled = process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === 'true';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
  role: z.enum(roles as [string, ...string[]], { required_error: 'Debes seleccionar un rol.' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: undefined,
    },
  });

  const handleRegister = async (data: RegisterFormValues) => {
    setError('');
    setIsSubmitting(true);
    try {
      const newUser = await db.addUser(data);

      if (newUser.status === 'pending_approval') {
        router.push('/pending-approval');
      } else {
        toast({
          title: 'Registro completado',
          description: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        });
        router.push('/login');
      }
    } catch (err: any) {
      if (err.message.includes('Este correo electrónico ya está en uso.')) {
        form.setError('email', {
          type: 'manual',
          message: 'Este correo electrónico ya está en uso.',
        });
      } else {
        setError(err.message || 'Ha ocurrido un error inesperado.');
        console.error(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formIsDisabled = isAuthLoading || isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <AppLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">TalentOS</CardTitle>
          </Link>
          <CardDescription>
            Crea una cuenta para acceder a la plataforma de formación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error de Registro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre y apellidos"
                    {...field}
                    disabled={formIsDisabled}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu.correo@empresa.com"
                    {...field}
                    disabled={formIsDisabled}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...field}
                    disabled={formIsDisabled}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="role">¿Cómo quieres registrarte?</Label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={formIsDisabled}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecciona un rol..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {field.value &&
                    [
                      'Formador',
                      'Jefe de Formación',
                      'Gestor de RRHH',
                      'Administrador General',
                    ].includes(field.value)
                      ? '⚠️ Este rol requiere aprobación de un administrador antes de poder acceder.'
                      : '✓ Este rol será activado automáticamente tras el registro.'}
                  </p>
                </div>
              )}
            />

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row-reverse">
              <Button type="submit" className="w-full sm:w-auto" disabled={formIsDisabled}>
                {formIsDisabled ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto"
                disabled={formIsDisabled}
              >
                <Link href="/login">Volver</Link>
              </Button>
            </div>
          </form>

          {authentikEnabled && (
            <p className="mt-6 text-xs text-muted-foreground text-center">
              Para acceso con Google o Microsoft (cuenta empresarial), usa la opción en la página de{' '}
              <Link href="/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
