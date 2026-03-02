import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Certificate, CertificateTemplate, Course, User } from '@/lib/types';
import { CertificateViewer } from './CertificateViewer';

type CertificateGeneratorProps = {
  certificate: Certificate;
  template: CertificateTemplate;
  user: User;
  course: Course;
  onDownloadSuccess?: () => void;
};

export function CertificateGenerator({
  certificate,
  template,
  user,
  course,
  onDownloadSuccess,
}: CertificateGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const verificationUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/certificates/verify?code=${certificate.verificationCode}`;
  }, [certificate.verificationCode]);

  useEffect(() => {
    if (!verificationUrl) return;
    QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl(''));
  }, [verificationUrl]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificado-${course.title}-${user.name}.pdf`);
      onDownloadSuccess?.();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificado</CardTitle>
        <CardDescription>Descarga el certificado en PDF.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="absolute -z-10 -left-[9999px] top-0">
          <CertificateViewer
            ref={certificateRef}
            certificate={certificate}
            templateType={template.type}
            user={user}
            course={course}
            qrCodeDataUrl={qrCodeDataUrl}
          />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div
            className="bg-muted p-4 scale-[0.6] origin-top-left"
            style={{ width: '166.66%', height: 'calc(794px * 0.6)' }}
          >
            <CertificateViewer
              certificate={certificate}
              templateType={template.type}
              user={user}
              course={course}
              qrCodeDataUrl={qrCodeDataUrl}
            />
          </div>
        </div>
        <Button onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Descargar PDF
        </Button>
      </CardContent>
    </Card>
  );
}
