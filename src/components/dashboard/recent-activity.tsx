// @ts-nocheck
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, Award, MessageSquare, Calendar, Users, Trophy, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function RecentActivity() {
  const { user } = useAuth();

  const recentLogs = useLiveQuery(
    async () => {
      if (!user) return [];
      const logs = await db.getSystemLogs();
      const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const recent = sorted.slice(0, 10);
      // Filtrar por userId si el log tiene ese campo (esquema v47+)
      const withUserId = recent.filter((log) => !(log as { userId?: string }).userId || (log as { userId?: string }).userId === user.id);
      return withUserId.length > 0 ? withUserId : recent;
    },
    [user?.id],
    []
  );

  const getActivityIcon = (event: string) => {
    if (event.includes('curso') || event.includes('course')) return BookOpen;
    if (event.includes('certificado') || event.includes('certificate')) return Award;
    if (event.includes('mensaje') || event.includes('message')) return MessageSquare;
    if (event.includes('evento') || event.includes('event')) return Calendar;
    if (event.includes('usuario') || event.includes('user')) return Users;
    if (event.includes('insignia') || event.includes('badge')) return Trophy;
    return Clock;
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'text-blue-500 bg-blue-500/10';
      case 'SUCCESS':
        return 'text-green-500 bg-green-500/10';
      case 'WARNING':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'ERROR':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (!user || !recentLogs) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Tus últimas acciones en la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {recentLogs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay actividad reciente</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {recentLogs.map((log) => {
                const Icon = getActivityIcon(log.event);
                const colorClasses = getActivityColor(log.level);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 border-l-2 border-muted pl-3 py-2 hover:border-primary transition-colors"
                  >
                    <div className={`rounded-lg p-2 ${colorClasses}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {log.event}
                      </p>
                      {log.metadata && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {typeof log.metadata === 'string' 
                            ? log.metadata 
                            : JSON.stringify(log.metadata).slice(0, 100)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.level}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
