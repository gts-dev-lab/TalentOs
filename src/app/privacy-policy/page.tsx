import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PrivacyPolicyPage() {
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
              <Link href="/dashboard">Ir al Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container max-w-4xl py-16 md:py-24">
          <div className="space-y-8">
            <h1 className="text-4xl font-bold">Política de Privacidad</h1>
            <p className="text-muted-foreground">Última actualización: 23 de Julio de 2025</p>

            <div className="prose prose-lg max-w-none text-foreground dark:prose-invert">
              <p>
                Esta Política de Privacidad describe nuestras políticas y procedimientos sobre la
                recopilación, uso y divulgación de tu información cuando utilizas el Servicio y te
                informa sobre tus derechos de privacidad y cómo la ley te protege.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                1. Recopilación y Uso de Datos Personales
              </h2>
              <p>
                Mientras usas nuestro Servicio, podemos pedirte que nos proporciones cierta
                información de identificación personal que se puede utilizar para contactarte o
                identificarte. La información de identificación personal puede incluir, entre otros:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dirección de correo electrónico</li>
                <li>Nombre y apellidos</li>
                <li>Datos de uso</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Datos de Uso</h2>
              <p>
                Los Datos de Uso se recopilan automáticamente cuando se utiliza el Servicio. Los
                Datos de Uso pueden incluir información como la dirección de Protocolo de Internet
                de tu dispositivo (por ejemplo, dirección IP), tipo de navegador, versión del
                navegador, las páginas de nuestro Servicio que visitas, la hora y fecha de tu
                visita, el tiempo que pasas en esas páginas y otros datos de diagnóstico.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">3. Uso de tus Datos Personales</h2>
              <p>La Compañía puede usar los Datos Personales para los siguientes propósitos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Para proporcionar y mantener nuestro Servicio</strong>, incluido el
                  seguimiento del uso de nuestro Servicio.
                </li>
                <li>
                  <strong>Para gestionar tu Cuenta:</strong> para gestionar tu registro como usuario
                  del Servicio.
                </li>
                <li>
                  <strong>Para contactarte:</strong> para contactarte por correo electrónico,
                  llamadas telefónicas, SMS u otras formas equivalentes de comunicación electrónica.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                4. Seguridad de tus Datos Personales
              </h2>
              <p>
                La seguridad de tus Datos Personales es importante para nosotros, pero recuerda que
                ningún método de transmisión por Internet o método de almacenamiento electrónico es
                100% seguro. Si bien nos esforzamos por utilizar medios comercialmente aceptables
                para proteger tus Datos Personales, no podemos garantizar su seguridad absoluta.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Enlaces a Otros Sitios Web</h2>
              <p>
                Nuestro Servicio puede contener enlaces a otros sitios web que no son operados por
                nosotros. Si haces clic en un enlace de un tercero, serás dirigido al sitio de ese
                tercero. Te recomendamos encarecidamente que revises la Política de Privacidad de
                cada sitio que visites.
              </p>
            </div>
          </div>
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
