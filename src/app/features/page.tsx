import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Bot, Zap, Target, CheckCircle, GraduationCap, AreaChart, Route } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Planes de Carrera Personalizados con IA',
    description:
      'Nuestra IA analiza el perfil, el rol y la formación previa de cada empleado para crear rutas de aprendizaje únicas y eficientes. Cierra brechas de habilidades de forma proactiva y alinea el desarrollo del talento con los objetivos de la empresa.',
  },
  {
    icon: Zap,
    title: 'Feedback Instantáneo y Automatizado',
    description:
      'Olvida las correcciones manuales. TalentOS evalúa los tests generados por IA y proporciona feedback constructivo al instante, fomentando un ciclo de mejora continua y liberando tiempo para los formadores.',
  },
  {
    icon: Target,
    title: 'Análisis Predictivo de Costes y Riesgos',
    description:
      'Anticípate a las necesidades. Nuestra plataforma no solo registra los costes, sino que utiliza la IA para predecir el riesgo de abandono de los alumnos, permitiéndote intervenir a tiempo y optimizar tu presupuesto de formación.',
  },
  {
    icon: GraduationCap,
    title: 'Gestión Integral de Cursos',
    description:
      'Crea cursos manualmente, impórtalos desde paquetes SCORM o deja que nuestra IA los genere por ti a partir de un simple tema. Gestiona recursos, calendarios y foros de discusión desde un único lugar.',
  },
  {
    icon: Route,
    title: 'Gamificación y Compromiso',
    description:
      'Fomenta una competencia sana y aumenta la participación con un sistema de puntos, insignias por logros y una clasificación general. Convierte el aprendizaje en una experiencia motivadora y gratificante.',
  },
  {
    icon: AreaChart,
    title: 'Dashboards y Reportes Visuales',
    description:
      'Analiza el progreso de la formación, la tasa de finalización por departamento o rol, los costes asociados y el cumplimiento de los cursos obligatorios con dashboards intuitivos y reportes exportables.',
  },
];

export default function FeaturesPage() {
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
            <Button asChild variant="outline">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/request-demo">Solicitar una Demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container max-w-5xl py-16 md:py-24">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tighter text-primary md:text-5xl lg:text-6xl">
              El Futuro de la Formación, Hoy
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Descubre cómo la Inteligencia Artificial se convierte en tu aliado estratégico para el
              desarrollo del talento, automatizando tareas y personalizando la experiencia de
              aprendizaje.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-transform hover:scale-105"
              >
                <feature.icon className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Final CTA Section */}
          <section className="mt-24 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              ¿Listo para Liderar la Transformación del Talento?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Agenda una demo personalizada y descubre cómo TalentOS puede construir equipos más
              competentes, motivados y preparados para el futuro.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/request-demo">Solicitar una Demo</Link>
            </Button>
          </section>
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
