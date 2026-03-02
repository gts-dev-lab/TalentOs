'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Loader2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as LucideIcons from 'lucide-react';
import { StatCard } from '../stat-card';

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) {
    return <Award className="h-6 w-6" />; // Fallback icon
  }
  return <IconComponent className="h-6 w-6" />;
};

export function AchievementsSettings({ user }: { user: User }) {
  const allBadges = useLiveQuery(() => db.getAllBadges(), []);
  const userBadges = useLiveQuery(() => db.getBadgesForUser(user.id), [user.id]);

  if (!allBadges || !userBadges) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const userBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  const earnedBadges = allBadges.filter(b => userBadgeIds.has(b.id));
  const unearnedBadges = allBadges.filter(b => !userBadgeIds.has(b.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Logros y Puntos</CardTitle>
        <CardDescription>
          Un resumen de tus puntos de experiencia y las insignias que has ganado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Puntos de Experiencia (XP)"
            value={user.points.toString()}
            icon={Award}
          />
          <StatCard
            title="Insignias Ganadas"
            value={earnedBadges.length.toString()}
            icon={Award}
            description={`de ${allBadges.length} posibles`}
          />
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Insignias Obtenidas</h3>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {earnedBadges.map(badge => (
                <TooltipProvider key={badge.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2 text-center p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="p-3 bg-green-100 rounded-full text-green-700">
                          <DynamicIcon name={badge.icon} />
                        </div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{badge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aún no has ganado ninguna insignia. ¡Sigue aprendiendo!
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Insignias por Desbloquear</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {unearnedBadges.map(badge => (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2 text-center p-4 border-2 border-dashed rounded-lg bg-muted/50 text-muted-foreground">
                      <div className="p-3 bg-muted rounded-full">
                        <Lock className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-sm">{badge.name}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
