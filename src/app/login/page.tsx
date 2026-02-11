
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/icons';
import { useAuth } from '@/contexts/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, Gitlab, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { users as testUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isSupabaseConfigured, supabase } from '@/lib/supabase-client';

const DEMO_PASSWORD = 'password123';
const authentikEnabled = process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === 'true';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser) {
        toast({
            title: `Bienvenido, ${loggedInUser.name.split(' ')[0]}`,
            description: "Has iniciado sesión correctamente.",
        });
        router.push('/dashboard');
      } else {
        setError("Credenciales incorrectas.");
      }
    } catch (err: any) {
      if (err.message.includes('desactivada')) {
        setError("Esta cuenta ha sido desactivada. Contacta con un administrador.");
      } else if (err.message.includes('pendiente de aprobación')) {
        setError("Esta cuenta está pendiente de aprobación por un administrador.");
      }
      else {
        setError("Credenciales incorrectas o usuario no encontrado.");
      }
      console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formIsDisabled = isAuthLoading || isSubmitting;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <AppLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">TalentOS</CardTitle>
          </Link>
          <CardDescription>La plataforma de formación impulsada por IA para tu equipo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
             {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Autenticación</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nombre@empresa.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formIsDisabled}
              />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link href="/forgot-password" className={`text-sm text-primary hover:underline ${formIsDisabled ? 'pointer-events-none opacity-50' : ''}`}>
                        ¿Has olvidado tu contraseña?
                    </Link>
                </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={formIsDisabled}
                />
            </div>
            <Button type="submit" className="w-full text-lg h-12" disabled={formIsDisabled}>
              {formIsDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {isAuthLoading ? "Iniciando..." : "Iniciando..."}</> : "Iniciar Sesión"}
            </Button>
            <div className="text-center text-sm space-x-1">
                <span>¿No tienes cuenta?</span>
                <Link href="/register" className={`text-primary hover:underline font-semibold ${formIsDisabled ? 'pointer-events-none opacity-50' : ''}`}>
                    Regístrate
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cuentas de Prueba</CardTitle>
          <CardDescription>Haz clic en un usuario para rellenar automáticamente sus credenciales.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-4">
          {testUsers.map(testUser => (
            <button
              key={testUser.id}
              onClick={() => {
                setEmail(testUser.email);
                setPassword(DEMO_PASSWORD);
              }}
              className="flex flex-col items-center gap-2 text-center text-xs hover:bg-muted p-2 rounded-lg transition-colors"
              disabled={formIsDisabled}
            >
              <Avatar>
                <AvatarImage src={testUser.avatar} alt={testUser.name} />
                <AvatarFallback>{testUser.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{testUser.name}</span>
              <span className="text-muted-foreground">{testUser.role}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {authentikEnabled && (
      <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                          O inicia sesión con cuenta empresarial
                      </span>
                  </div>
              </div>
              <Button
                variant="default"
                className="w-full"
                onClick={() => signIn('authentik', { callbackUrl: '/dashboard' })}
                disabled={formIsDisabled}
              >
                <Shield className="mr-2 h-4 w-4" />
                Google / Microsoft (Authentik)
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Proveedor de identidad autoalojado. Configuración en el servidor.
              </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
