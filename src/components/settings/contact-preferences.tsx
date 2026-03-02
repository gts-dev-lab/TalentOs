'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationChannel } from '@/lib/types';
import { notificationChannels } from '@/lib/types';

export function ContactPreferences({
  preferences,
  setPreferences,
}: {
  preferences: any;
  setPreferences: Function;
}) {
  if (!preferences) return <Skeleton className="h-64 w-full" />;

  const handleChannelChange = (channel: NotificationChannel, checked: boolean) => {
    const currentChannels = preferences.channels || [];
    const newChannels = checked
      ? [...currentChannels, channel]
      : currentChannels.filter((c: NotificationChannel) => c !== channel);
    setPreferences({ ...preferences, channels: newChannels });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias de Contacto</CardTitle>
        <CardDescription>
          Elige cómo quieres recibir las notificaciones y comunicaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="consent-check" className="font-semibold text-base">
              Autorización de Comunicaciones
            </Label>
            <p className="text-sm text-muted-foreground pr-4">
              Autorizo recibir comunicaciones sobre cursos, certificados y notificaciones
              institucionales.
            </p>
          </div>
          <Switch
            id="consent-check"
            checked={preferences.consent}
            onCheckedChange={checked => setPreferences({ ...preferences, consent: checked })}
          />
        </div>
        <div className="space-y-4">
          <Label className={!preferences.consent ? 'text-muted-foreground' : ''}>
            Canales de Notificación Preferidos
          </Label>
          <div className="space-y-2 rounded-lg border p-4">
            {notificationChannels.map(channel => (
              <div key={channel} className="flex items-center space-x-3">
                <Checkbox
                  id={`channel-${channel}`}
                  checked={preferences.channels?.includes(channel)}
                  onCheckedChange={checked => handleChannelChange(channel, !!checked)}
                  disabled={!preferences.consent}
                />
                <Label
                  htmlFor={`channel-${channel}`}
                  className={`font-normal capitalize ${!preferences.consent ? 'text-muted-foreground cursor-not-allowed' : ''}`}
                >
                  {channel === 'app'
                    ? 'App (Notificaciones Push)'
                    : channel === 'email'
                      ? 'Email'
                      : 'WhatsApp'}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
