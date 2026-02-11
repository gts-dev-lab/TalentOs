import { forwardRef } from 'react';
import { format } from 'date-fns';
import { CertificateTemplate } from '@/components/certificate-template';
import { CertificateTemplateModern } from '@/components/certificate-template-modern';
import { CertificateTemplateProfessional } from '@/components/certificate-template-professional';
import type { Certificate, CertificateTemplateType, Course, User } from '@/lib/types';

type CertificateViewerProps = {
  certificate: Certificate;
  templateType: CertificateTemplateType;
  user: User;
  course: Course;
  qrCodeDataUrl: string;
};

export const CertificateViewer = forwardRef<HTMLDivElement, CertificateViewerProps>(
  ({ certificate, templateType, user, course, qrCodeDataUrl }, ref) => {
    const completionDate = format(new Date(certificate.issuedAt), 'dd/MM/yyyy');

    if (templateType === 'Moderno') {
      return (
        <CertificateTemplateModern
          ref={ref}
          userName={user.name}
          courseName={course.title}
          completionDate={completionDate}
          instructorName={course.instructor}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );
    }

    if (templateType === 'Profesional') {
      return (
        <CertificateTemplateProfessional
          ref={ref}
          userName={user.name}
          courseName={course.title}
          completionDate={completionDate}
          instructorName={course.instructor}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );
    }

    return (
      <CertificateTemplate
        ref={ref}
        userName={user.name}
        courseName={course.title}
        completionDate={completionDate}
        instructorName={course.instructor}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    );
  }
);

CertificateViewer.displayName = 'CertificateViewer';
