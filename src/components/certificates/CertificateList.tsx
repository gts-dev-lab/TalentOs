import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Certificate, Course, User } from '@/lib/types';

type CertificateListProps = {
  certificates: Certificate[];
  usersById: Map<string, User>;
  coursesById: Map<string, Course>;
  showUser?: boolean;
};

const statusLabels: Record<Certificate['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Activo', variant: 'default' },
  expired: { label: 'Vencido', variant: 'secondary' },
  revoked: { label: 'Revocado', variant: 'destructive' },
};

export function CertificateList({ certificates, usersById, coursesById, showUser }: CertificateListProps) {
  if (certificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificados</CardTitle>
          <CardDescription>No hay certificados disponibles.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {certificates.map((certificate) => {
        const user = usersById.get(certificate.userId);
        const course = coursesById.get(certificate.courseId);
        const status = statusLabels[certificate.status];

        return (
          <Card key={certificate.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{course?.title || 'Curso desconocido'}</CardTitle>
                  <CardDescription>
                    {showUser && user ? `${user.name} • ` : ''}
                    Código: {certificate.verificationCode}
                  </CardDescription>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/certificates/${certificate.id}`} className="text-sm text-primary hover:underline">
                Ver detalle del certificado
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
