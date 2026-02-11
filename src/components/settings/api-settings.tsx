
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Server, Database, MessageSquare, Code } from 'lucide-react';

export function ApiSettings() {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Configuración de APIs Externas</CardTitle>
                <CardDescription>Las claves de API deben configurarse como variables de entorno en <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> para mayor seguridad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert variant="default" className="border-blue-200 bg-blue-50">
                    <Server className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">Configuración mediante Variables de Entorno</AlertTitle>
                    <AlertDescription className="text-blue-800">
                        Por seguridad, las API keys ahora deben configurarse en <code className="text-xs bg-white px-1 py-0.5 rounded">.env.local</code> (desarrollo) o en las variables de entorno de tu plataforma de hosting (producción). Consulta <code className="text-xs bg-white px-1 py-0.5 rounded">docs/SETUP_GUIDE.md</code> para más detalles.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Database />Supabase (Sincronización)</h3>
                    <p className="text-sm text-muted-foreground mb-3">Necesario para la sincronización de datos. Obtén la clave en Project Settings &gt; API de tu proyecto Supabase.</p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                        <div><code>SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_secreta</code></div>
                    </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare/>Twilio (WhatsApp)</h3>
                    <p className="text-sm text-muted-foreground mb-3">Opcional. Para enviar notificaciones por WhatsApp.</p>
                    <div className="bg-muted p-3 rounded font-mono text-sm space-y-1">
                        <div><code>TWILIO_ACCOUNT_SID=AC...</code></div>
                        <div><code>TWILIO_AUTH_TOKEN=tu_auth_token</code></div>
                        <div><code>TWILIO_WHATSAPP_FROM=+14155238886</code></div>
                        <div><code>TWILIO_WHATSAPP_TO_TEST=+34123456789</code></div>
                    </div>
                </div>

                <Alert className="mt-6">
                    <Code className="h-4 w-4" />
                    <AlertTitle>Ejemplo de .env.local</AlertTitle>
                    <AlertDescription className="font-mono text-xs">
                        <pre className="whitespace-pre-wrap">{`# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Twilio (opcional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx`}</pre>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
