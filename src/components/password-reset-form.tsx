// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PasswordResetForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const hasAccessToken = searchParams.has('access_token');

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Contraseña Actualizada',
        description: 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.',
      });

      router.push('/login');
    } catch (err: any) {
      setError(
        err.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // This effect handles the session setup from the recovery link's access token
  // It should only run once when the component mounts with the token
  useState(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .catch(console.error);
    }
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <AppLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">TalentOS</CardTitle>
          </Link>
          <CardDescription>Establece tu nueva contraseña para acceder a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          {hasAccessToken ? (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restablecer Contraseña
              </Button>
            </form>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>
                Este enlace de restablecimiento no es válido o ha expirado. Por favor, solicita uno
                nuevo.
              </p>
              <Button asChild variant="link" className="mt-4">
                <Link href="/login">Volver a Inicio de Sesión</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
