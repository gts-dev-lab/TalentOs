'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { TrainingHistory } from '@/components/settings/training-history';
import { CertificateList } from '@/components/certificates/CertificateList';
import { PrivacyAndDataSettings } from '@/components/settings/privacy-and-data';
import type { Course } from '@/lib/types';
import { AchievementsSettings } from '@/components/settings/achievements-settings';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        points: user.points,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const certificates = useLiveQuery(
    () => (user ? db.getCertificatesForUser(user.id) : []),
    [user?.id]
  );
  const courses = useLiveQuery<Course[]>(() => db.getAllCourses(), []);

  const usersById = useMemo(() => new Map(user ? [[user.id, user]] : []), [user]);
  const coursesById = useMemo(() => new Map((courses || []).map(c => [c.id, c])), [courses]);

  if (!user || !profile || certificates === undefined || courses === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const handleSaveChanges = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const updatedData: Partial<User> = {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        role: profile.role,
        phone: profile.phone,
      };

      await db.updateUser(user.id, updatedData);

      // The auth context will refresh on next load.

      toast({
        title: 'Perfil Guardado',
        description: 'Tus cambios han sido guardados correctamente.',
      });
    } catch (error: any) {
      if (error.name === 'ConstraintError') {
        toast({
          title: 'Error al Guardar',
          description: 'Ese correo electrónico ya está en uso por otro usuario.',
          variant: 'destructive',
        });
      } else {
        console.error('Saving settings failed', error);
        toast({
          title: 'Error',
          description: 'No se pudieron guardar los cambios.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const userTabs = [
    { value: 'profile', label: 'Información Personal' },
    { value: 'certificates', label: 'Certificados' },
    { value: 'achievements', label: 'Logros' },
    { value: 'training-history', label: 'Historial Formativo' },
    { value: 'privacy', label: 'Datos y privacidad' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal, logros y formación.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-1 md:grid-cols-4 lg:grid-cols-5">
            {userTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <ProfileSettings profile={profile} setProfile={setProfile} />
            <div className="flex justify-end mt-6">
              <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Información Personal
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="certificates" className="mt-4">
            <CertificateList
              certificates={certificates || []}
              usersById={usersById}
              coursesById={coursesById}
            />
          </TabsContent>
          <TabsContent value="achievements" className="mt-4">
            <AchievementsSettings user={user} />
          </TabsContent>
          <TabsContent value="training-history" className="mt-4">
            <TrainingHistory />
          </TabsContent>
          <TabsContent value="privacy" className="mt-4">
            <PrivacyAndDataSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
