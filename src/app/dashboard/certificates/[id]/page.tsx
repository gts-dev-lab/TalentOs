'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { isSuperadmin } from '@/lib/superadmin';
import * as db from '@/lib/db';
import { CertificateGenerator } from '@/components/certificates/CertificateGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CertificateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const certificate = useLiveQuery(async () => {
    const result = await db.getCertificateById(params.id);
    return result || null;
  }, [params.id]);
  const certificateUser = useLiveQuery(() => (certificate ? db.getUserById(certificate.userId) : null), [certificate?.userId]);
  const certificateCourse = useLiveQuery(() => (certificate ? db.getCourseById(certificate.courseId) : null), [certificate?.courseId]);
  const certificateTemplate = useLiveQuery(() => (certificate ? db.getCertificateTemplateById(certificate.templateId) : null), [certificate?.templateId]);

  useEffect(() => {
    if (!user || !certificate) return;
    const canSeeAll = user.role === 'Administrador General' || user.role === 'Jefe de Formación' || isSuperadmin(user.email);
    if (!canSeeAll && certificate.userId !== user.id) {
      router.push('/dashboard/certificates');
    }
  }, [user, certificate, router]);

  if (!user || certificate === undefined || certificateUser === undefined || certificateCourse === undefined || certificateTemplate === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!certificate || !certificateUser || !certificateCourse || !certificateTemplate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificado no encontrado</CardTitle>
        </CardHeader>
        <CardContent>El certificado solicitado no existe.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Detalle del Certificado</h1>
        <p className="text-muted-foreground">Código: {certificate.verificationCode}</p>
      </div>
      <CertificateGenerator
        certificate={certificate}
        template={certificateTemplate}
        user={certificateUser}
        course={certificateCourse}
      />
    </div>
  );
}
