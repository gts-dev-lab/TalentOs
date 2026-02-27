'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/auth';
import { isSuperadmin } from '@/lib/superadmin';
import * as db from '@/lib/db';
import { CertificateList } from '@/components/certificates/CertificateList';
import { Pagination } from '@/components/ui/pagination';
import type { Course, User } from '@/lib/types';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const certificates = useLiveQuery(() => {
    if (!user) return [];
    const canSeeAll = user.role === 'Administrador General' || user.role === 'Jefe de Formación' || isSuperadmin(user.email);
    return canSeeAll ? db.getAllCertificates() : db.getCertificatesForUser(user.id);
  }, [user?.id, user?.role]);

  const users = useLiveQuery<User[]>(() => db.getAllUsers(), []);
  const courses = useLiveQuery<Course[]>(() => db.getAllCourses(), []);

  const usersById = useMemo(() => new Map((users || []).map(u => [u.id, u])), [users]);
  const coursesById = useMemo(() => new Map((courses || []).map(c => [c.id, c])), [courses]);

  const totalPages = Math.ceil((certificates?.length || 0) / itemsPerPage);
  const paginatedCertificates = useMemo(() => {
    if (!certificates) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return certificates.slice(start, start + itemsPerPage);
  }, [certificates, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!user || certificates === undefined || users === undefined || courses === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const showUser = user.role === 'Administrador General' || user.role === 'Jefe de Formación' || isSuperadmin(user.email);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Certificados</h1>
        <p className="text-muted-foreground">Consulta los certificados emitidos en la plataforma.</p>
      </div>
      <CertificateList certificates={paginatedCertificates} usersById={usersById} coursesById={coursesById} showUser={showUser} />
      {certificates && certificates.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={certificates.length}
          />
        </div>
      )}
    </div>
  );
}
