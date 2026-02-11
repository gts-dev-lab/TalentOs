
'use client';

import { Bell, Search, LogOut, Circle, CheckCheck } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from './theme-toggle';
import { GlobalSearch } from './global-search';

interface DashboardHeaderProps {
    title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = useLiveQuery(
    () => (user ? db.getNotificationsForUser(user.id) : []),
    [user?.id],
    []
  );

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleNotificationClick = (notificationId?: number) => {
    if (notificationId) {
      db.markNotificationAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
      e.preventDefault();
      if(user) {
          db.markAllNotificationsAsRead(user.id);
          toast({
              title: "Todas las notificaciones han sido marcadas como leídas.",
          })
      }
  }

  
  return (
    <header className="frappe-topbar sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-[hsl(var(--frappe-topbar-bg))] px-4 shadow-frappe-sm md:px-6 dark:bg-[hsl(var(--frappe-topbar-bg))] dark:border-[hsl(var(--frappe-topbar-border))]">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto">
          <GlobalSearch />
        </div>
        <ThemeToggle />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                        </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications && notifications.length > 0 ? (
                        notifications.map(n => (
                            <DropdownMenuItem key={n.id} asChild className="cursor-pointer" onSelect={() => handleNotificationClick(n.id)}>
                                <Link href={n.relatedUrl || '#'} className="flex items-start gap-3 p-2">
                                    {!n.isRead && <Circle className="h-2 w-2 mt-1.5 fill-primary text-primary flex-shrink-0" />}
                                    <div className={cn("flex-grow space-y-1", n.isRead ? 'pl-5 text-muted-foreground' : '')}>
                                        <p className="text-sm leading-snug whitespace-normal">{n.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(n.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">No tienes notificaciones.</p>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    <span>Marcar todas como leídas</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
                {user && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/preferences">Preferencias</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Soporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
