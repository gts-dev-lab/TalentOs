
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { NotificationChannel, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactPreferences } from '@/components/settings/contact-preferences';
import { PushNotificationSettings } from '@/components/settings/push-notification-settings';

export default function PreferencesPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [preferences, setPreferences] = useState<{
        consent: boolean;
        channels: NotificationChannel[];
    } | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setPreferences(user.notificationSettings || {
                consent: false,
                channels: [],
            });
        }
    }, [user]);

    if (!user || !preferences) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    const handleSaveChanges = async () => {
        if (!user || !preferences) return;

        setIsSaving(true);
        try {
            const updatedData = {
                notificationSettings: preferences,
            };

            await db.updateUser(user.id, updatedData);
            
            toast({
                title: "Preferencias Guardadas",
                description: "Tus preferencias de contacto han sido guardadas.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "No se pudieron guardar tus preferencias.",
                variant: "destructive",
            });
            console.error("Saving preferences failed", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Preferencias de Contacto</h1>
                <p className="text-muted-foreground">Gestiona tus preferencias de contacto y notificaciones.</p>
            </div>
            
            <ContactPreferences preferences={preferences} setPreferences={setPreferences} />
            <PushNotificationSettings />

            <div className="flex justify-end">
                <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Preferencias de Contacto
                </Button>
            </div>
        </div>
    );
}
