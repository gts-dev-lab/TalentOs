'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Check,
  Hourglass,
  Send,
  Star,
  XCircle,
  Trash2,
  AlertCircle,
  UserX,
  CalendarX2,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EnrollmentStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const statusInfo: Record<EnrollmentStatus, { label: string; icon: LucideIcon; color: string }> = {
    pending: {
      label: 'Pendiente',
      icon: Hourglass,
      color: 'text-amber-600 bg-amber-100 border-amber-200',
    },
    approved: { label: 'Aprobada', icon: Check, color: 'text-sky-600 bg-sky-100 border-sky-200' },
    active: { label: 'En Curso', icon: Send, color: 'text-blue-600 bg-blue-100 border-blue-200' },
    completed: {
      label: 'Finalizado',
      icon: Star,
      color: 'text-green-600 bg-green-100 border-green-200',
    },
    rejected: {
      label: 'Rechazada',
      icon: XCircle,
      color: 'text-red-600 bg-red-100 border-red-200',
    },
    cancelled: {
      label: 'Cancelada',
      icon: Trash2,
      color: 'text-gray-600 bg-gray-100 border-gray-200',
    },
    waitlisted: {
      label: 'En Espera',
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-100 border-orange-200',
    },
    expelled: { label: 'Expulsado', icon: UserX, color: 'text-white bg-red-800 border-red-900' },
    expired: {
      label: 'Caducada',
      icon: CalendarX2,
      color: 'text-gray-600 bg-gray-100 border-gray-200',
    },
    needs_review: {
      label: 'En Revisión',
      icon: HelpCircle,
      color: 'text-purple-600 bg-purple-100 border-purple-200',
    },
  };

  const { label, icon: Icon, color } = statusInfo[status];
  return (
    <Badge variant="outline" className={cn('gap-1.5 capitalize', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
