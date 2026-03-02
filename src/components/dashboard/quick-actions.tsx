'use client';

import Link from 'next/link';
import {
  PlusCircle,
  BookOpen,
  Users,
  Award,
  Target,
  ShieldCheck,
  Calendar,
  MessageSquare,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';

export function QuickActions() {
  const { user } = useAuth();

  const isManager =
    user && ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);
  const isAdmin = user && user.role === 'Administrador General';

  const actions = [
    {
      title: 'Explorar Cursos',
      description: 'Descubre nuevas formaciones',
      icon: BookOpen,
      href: '/dashboard/courses',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      roles: ['all'],
    },
    {
      title: 'Mis Certificados',
      description: 'Ver certificados obtenidos',
      icon: Award,
      href: '/dashboard/certificates',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      roles: ['all'],
    },
    {
      title: 'Chat',
      description: 'Comunícate con tu equipo',
      icon: MessageSquare,
      href: '/dashboard/chat',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      roles: ['all'],
    },
    {
      title: 'Calendario',
      description: 'Ver eventos próximos',
      icon: Calendar,
      href: '/dashboard/calendar',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      roles: ['all'],
    },
    {
      title: 'Crear Curso',
      description: 'Añadir nueva formación',
      icon: PlusCircle,
      href: '/dashboard/courses/create',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      roles: ['manager'],
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Administrar equipo',
      icon: Users,
      href: '/dashboard/users',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      roles: ['manager'],
    },
    {
      title: 'Crear PDI',
      description: 'Plan de desarrollo',
      icon: Target,
      href: '/dashboard/pdi/new',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      roles: ['manager'],
    },
    {
      title: 'Compliance',
      description: 'Gestionar normativas',
      icon: ShieldCheck,
      href: '/dashboard/compliance',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      roles: ['manager'],
    },
    {
      title: 'Análisis',
      description: 'Ver reportes y métricas',
      icon: TrendingUp,
      href: '/dashboard/analytics',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      roles: ['manager'],
    },
    {
      title: 'Backups',
      description: 'Gestionar copias de seguridad',
      icon: FileText,
      href: '/dashboard/settings',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      roles: ['admin'],
    },
  ];

  const visibleActions = actions.filter(action => {
    if (action.roles.includes('all')) return true;
    if (action.roles.includes('manager') && isManager) return true;
    if (action.roles.includes('admin') && isAdmin) return true;
    return false;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleActions.map(action => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4 hover:border-primary transition-colors w-full"
              >
                <div className={`rounded-lg p-2 ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
