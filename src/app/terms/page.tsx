import Link from 'next/link';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function TermsOfServicePage() {
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
            <h1 className="text-4xl font-bold">Términos y Condiciones de Servicio</h1>
            <p className="text-muted-foreground">Última actualización: 23 de Julio de 2025</p>

            <div className="prose prose-lg max-w-none text-foreground dark:prose-invert">
              <p>
                Bienvenido a TalentOS. Estos términos y condiciones describen las reglas y
                regulaciones para el uso del sitio web de TalentOS, ubicado en esta misma URL.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Aceptación de los Términos</h2>
              <p>
                Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No
                continúes usando TalentOS si no estás de acuerdo con todos los términos y
                condiciones establecidos en esta página.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Licencia de Uso</h2>
              <p>
                A menos que se indique lo contrario, TalentOS y/o sus licenciantes poseen los
                derechos de propiedad intelectual de todo el material en TalentOS. Todos los
                derechos de propiedad intelectual están reservados. Puedes acceder a esto desde
                TalentOS para tu propio uso personal sujeto a las restricciones establecidas en
                estos términos y condiciones.
              </p>
              <p>No debes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Volver a publicar material de TalentOS</li>
                <li>Vender, alquilar o sublicenciar material de TalentOS</li>
                <li>Reproducir, duplicar o copiar material de TalentOS</li>
                <li>Redistribuir contenido de TalentOS</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">3. Cuentas de Usuario</h2>
              <p>
                Cuando creas una cuenta con nosotros, debes proporcionarnos información que sea
                precisa, completa y actual en todo momento. El incumplimiento de esto constituye una
                violación de los Términos, lo que puede resultar en la terminación inmediata de tu
                cuenta en nuestro Servicio.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitación de Responsabilidad</h2>
              <p>
                En ninguna circunstancia TalentOS, ni sus directores, empleados, socios, agentes,
                proveedores o afiliados, serán responsables de daños indirectos, incidentales,
                especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de
                beneficios, datos, uso, buena voluntad u otras pérdidas intangibles, como resultado
                de tu acceso o uso o incapacidad para acceder o usar el Servicio.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cambios en los Términos</h2>
              <p>
                Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar
                estos Términos en cualquier momento. Si una revisión es material, intentaremos
                proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos
                términos. Lo que constituye un cambio material se determinará a nuestra sola
                discreción.
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
            <Link href="#" className="hover:text-primary">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
