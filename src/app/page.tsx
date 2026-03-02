'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, CheckCircle, Loader2, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if user is already logged in
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">TalentOS</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Ir al Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/request-demo">Solicitar una Demo</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container grid max-w-7xl grid-cols-1 items-center gap-12 py-12 md:grid-cols-2 md:py-24">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tighter text-primary md:text-5xl lg:text-6xl">
              Eleva tu Talento con Formación Inteligente
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
              TalentOS personaliza el aprendizaje, automatiza la gestión y maximiza el potencial de
              tu equipo con el poder de la Inteligencia Artificial.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
              <Button asChild size="lg">
                <Link href="/request-demo">
                  Solicitar una Demo <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/features">Ver Funcionalidades</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 md:h-96">
            <Image
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop"
              alt="Un equipo colaborando en una oficina moderna durante una sesión de formación."
              fill
              priority
              className="rounded-xl shadow-2xl object-cover"
              data-ai-hint="team training"
            />
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container max-w-7xl text-center">
            <h2 className="text-3xl font-bold">
              La formación no debería ser un coste, sino una inversión estratégica.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
              ¿Te enfrentas a planes de formación genéricos, baja participación y dificultades para
              medir el impacto real? TalentOS convierte estos desafíos en oportunidades de
              crecimiento.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container max-w-7xl py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-bold">El Futuro de la Formación, Hoy</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Descubre cómo la IA se convierte en tu aliado estratégico para el desarrollo del
              talento.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
            <div className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <Bot className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-bold">Planes de Carrera Personalizados</h3>
              <p className="text-muted-foreground">
                Nuestra IA analiza el perfil y las necesidades de cada empleado para crear rutas de
                aprendizaje únicas que cierran brechas de habilidades de forma eficiente.
              </p>
            </div>
            <div className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <Zap className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-bold">Feedback Instantáneo y Automatizado</h3>
              <p className="text-muted-foreground">
                Olvida las correcciones manuales. TalentOS evalúa las pruebas y proporciona feedback
                constructivo al instante, fomentando un ciclo de mejora continua.
              </p>
            </div>
            <div className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              <Target className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-bold">Análisis Predictivo de Costes y Riesgos</h3>
              <p className="text-muted-foreground">
                Anticípate a las necesidades. Nuestra plataforma no solo registra los costes, sino
                que predice el riesgo de abandono y te ayuda a optimizar tu presupuesto.
              </p>
            </div>
          </div>
        </section>

        {/* Business Benefits Section */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container grid max-w-7xl items-center gap-12 md:grid-cols-2">
            <div className="relative h-64 md:h-96">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                alt="Una persona presentando gráficos de crecimiento en una pizarra a un equipo atento."
                fill
                className="rounded-xl shadow-2xl object-cover"
                data-ai-hint="business analytics"
              />
            </div>
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Resultados que Impulsan tu Negocio</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
                  <div>
                    <h4 className="text-lg font-semibold">Maximiza el ROI de tu Formación</h4>
                    <p className="text-muted-foreground">
                      Con un seguimiento de costes preciso y análisis del impacto, cada euro
                      invertido en formación se traduce en un crecimiento medible.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
                  <div>
                    <h4 className="text-lg font-semibold">
                      Desarrolla Competencias Clave, Más Rápido
                    </h4>
                    <p className="text-muted-foreground">
                      Los planes de aprendizaje personalizados y el feedback continuo aceleran el
                      desarrollo de las habilidades que tu empresa realmente necesita.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-500" />
                  <div>
                    <h4 className="text-lg font-semibold">
                      Fomenta la Lealtad y Reduce la Rotación
                    </h4>
                    <p className="text-muted-foreground">
                      Demuestra a tu equipo que inviertes en su futuro. Una formación relevante es
                      una de las herramientas más potentes para la retención del talento.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container max-w-7xl py-16 text-center md:py-24">
          <h2 className="text-3xl font-bold md:text-4xl">
            ¿Listo para Liderar la Transformación del Talento?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Descubre cómo las empresas líderes están utilizando TalentOS para construir equipos más
            competentes, motivados y preparados para el futuro. Agenda una demo personalizada hoy
            mismo.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/request-demo">Solicitar una Demo</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex h-20 max-w-7xl flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <AppLogo className="h-5 w-5" />
            <p>&copy; {new Date().getFullYear()} TalentOS. Todos los derechos reservados.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-primary">
              Términos de Servicio
            </Link>
            <Link href="/privacy-policy" className="hover:text-primary">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
