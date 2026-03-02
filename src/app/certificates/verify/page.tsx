'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as db from '@/lib/db';
import type { Certificate, Course, User, CertificateTemplate } from '@/lib/types';
import { CertificateViewer } from '@/components/certificates/CertificateViewer';
import QRCode from 'qrcode';

export default function CertificateVerificationPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const verificationUrl = useMemo(() => {
    if (typeof window === 'undefined' || !certificate) return '';
    return `${window.location.origin}/certificates/verify?code=${certificate.verificationCode}`;
  }, [certificate]);

  useEffect(() => {
    const initialCode = searchParams.get('code');
    if (initialCode) {
      setCode(initialCode);
      void handleVerify(initialCode);
    }
  }, [searchParams, handleVerify]);

  useEffect(() => {
    if (!verificationUrl) return;
    QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => setQrCodeDataUrl(''));
  }, [verificationUrl]);

  const handleVerify = useCallback(async (verificationCode?: string) => {
    const codeToCheck = (verificationCode || code).trim();
    if (!codeToCheck) return;
    setIsChecking(true);
    setCertificate(null);
    setUser(null);
    setCourse(null);
    setTemplate(null);

    try {
      const found = await db.getCertificateByVerificationCode(codeToCheck);
      if (!found) return;
      const [foundUser, foundCourse, foundTemplate] = await Promise.all([
        db.getUserById(found.userId),
        db.getCourseById(found.courseId),
        db.getCertificateTemplateById(found.templateId),
      ]);
      setCertificate(found);
      setUser(foundUser || null);
      setCourse(foundCourse || null);
      setTemplate(foundTemplate || null);
    } finally {
      setIsChecking(false);
    }
  }, [code]);

  const isValid = Boolean(certificate && user && course && template && certificate.status === 'active');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Verificación de Certificados</CardTitle>
          <CardDescription>Introduce el código para verificar la validez del certificado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: CERT-ABC123" />
            <Button onClick={() => handleVerify()} disabled={isChecking}>
              {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verificar
            </Button>
          </div>

          {isChecking ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando certificado...
            </div>
          ) : certificate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {isValid ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <ShieldX className="h-5 w-5 text-red-600" />}
                <span className={isValid ? 'text-green-700' : 'text-red-700'}>
                  {isValid ? 'Certificado válido' : 'Certificado inválido o revocado'}
                </span>
              </div>
              {user && course && template && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4 scale-[0.6] origin-top-left" style={{ width: '166.66%', height: 'calc(794px * 0.6)' }}>
                    <CertificateViewer
                      certificate={certificate}
                      templateType={template.type}
                      user={user}
                      course={course}
                      qrCodeDataUrl={qrCodeDataUrl}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : code ? (
            <div className="text-red-600">No se encontró ningún certificado con ese código.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
