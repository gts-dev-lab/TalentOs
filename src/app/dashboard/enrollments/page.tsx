'use client';

import { useAuth } from '@/contexts/auth';
import { Loader2 } from 'lucide-react';
import { AdminEnrollmentsView } from '@/components/enrollments/admin-view';
import { StudentEnrollmentsView } from '@/components/enrollments/student-view';

export default function EnrollmentsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const isManager = ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(
    user.role
  );

  return isManager ? <AdminEnrollmentsView /> : <StudentEnrollmentsView user={user} />;
}
