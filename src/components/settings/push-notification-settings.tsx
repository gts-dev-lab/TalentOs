'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { sendTestPushNotificationAction } from '@/app/dashboard/settings/actions';

export function PushNotificationSettings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Verificar si las notificaciones están soportadas
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const handleSubscribe = async () => {
        if (!isSupported) {
            toast({
                title: 'No Soportado',
                description: 'Tu navegador no soporta notificaciones.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            // Solicitar permiso para notificaciones
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toast({
                    title: '¡Suscripción Exitosa!',
                    description: 'Ahora recibirás notificaciones en este navegador.',
                });
                
                // Enviar una notificación de prueba
                if ('serviceWorker' in navigator) {
                    // Mostrar notificación de prueba usando la API nativa
                    new Notification('Notificación de Prueba', {
                        body: '¡La configuración funciona correctamente!',
                        icon: '/icon-192x192.png',
                        badge: '/icon-192x192.png',
                    });
                }
            } else if (result === 'denied') {
                toast({
                    title: 'Permisos Denegados',
                    description: 'Por favor, permite las notificaciones en la configuración de tu navegador.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Permisos Cancelados',
                    description: 'No se pudieron activar las notificaciones.',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Failed to subscribe to push notifications', error);
            toast({
                title: 'Error de Suscripción',
                description: error.message || 'No se pudieron activar las notificaciones.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Notificaciones Push</CardTitle>
                    <CardDescription>Recibe alertas instantáneas en tu dispositivo sobre anuncios y eventos importantes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-gray-500">
                        <XCircle className="h-5 w-5" />
                        <p>Tu navegador no soporta notificaciones push.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notificaciones Push</CardTitle>
                <CardDescription>
                    Recibe alertas instantáneas en tu dispositivo sobre anuncios y eventos importantes.
                    <br />
                    <span className="text-sm text-muted-foreground">
                        Usa la API nativa del navegador. Las notificaciones solo funcionan cuando la aplicación está abierta.
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {permission === 'granted' ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <CheckCircle className="h-5 w-5" />
                            <p>Las notificaciones push están activadas en este navegador.</p>
                        </div>
                        <Button 
                            onClick={async () => {
                                try {
                                    await sendTestPushNotificationAction();
                                    toast({
                                        title: 'Notificación Enviada',
                                        description: 'Revisa tu navegador para ver la notificación de prueba.',
                                    });
                                } catch (error) {
                                    toast({
                                        title: 'Error',
                                        description: 'No se pudo enviar la notificación de prueba.',
                                        variant: 'destructive',
                                    });
                                }
                            }}
                            variant="outline"
                        >
                            Enviar Notificación de Prueba
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleSubscribe} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Activando...' : 'Activar Notificaciones'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
