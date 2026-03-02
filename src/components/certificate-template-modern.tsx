import React from 'react';
import { AppLogo } from '@/components/icons';

interface CertificateTemplateProps {
  userName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  qrCodeDataUrl: string;
}

export const CertificateTemplateModern = React.forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ userName, courseName, completionDate, instructorName, qrCodeDataUrl }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[1123px] h-[794px] bg-white text-gray-800 font-sans flex relative overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-green-50 z-0"></div>

        {/* Left Ornaments */}
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-200/50 rounded-full"></div>
        <div className="absolute top-10 left-10 w-8 h-8 bg-green-200/50 rounded-full"></div>

        {/* Right Ornaments */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-200/50 rounded-full"></div>

        {/* Content */}
        <div className="z-10 flex flex-col w-full p-16">
          <header className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AppLogo className="h-12 w-12 text-primary" />
              <span className="text-3xl font-bold text-gray-700">TalentOS</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-500">Certificado de Finalización</p>
              <p className="text-xs text-gray-400">ID: CERT-{Date.now()}</p>
            </div>
          </header>

          <main className="flex-grow flex flex-col justify-center text-center my-8">
            <p className="text-xl text-gray-600 mb-2">Se otorga este certificado a</p>
            <h1 className="text-5xl font-bold text-primary my-4">{userName}</h1>
            <p className="text-xl text-gray-600">por haber completado con éxito la formación</p>
            <h2 className="text-3xl font-semibold text-gray-800 mt-4">{courseName}</h2>
          </main>

          <footer className="flex justify-between items-end text-sm">
            <div className="text-left">
              <p className="font-bold">{instructorName}</p>
              <p className="text-gray-500 border-t mt-1 pt-1">Instructor Principal</p>
            </div>
            <div className="text-center">
              {qrCodeDataUrl && (
                <img
                  src={qrCodeDataUrl}
                  alt="Código QR de Verificación"
                  className="h-20 w-20 mx-auto"
                />
              )}
              <p className="text-xs text-gray-400 mt-1">Verificar validez</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{completionDate}</p>
              <p className="text-gray-500 border-t mt-1 pt-1">Fecha de Emisión</p>
            </div>
          </footer>
        </div>
      </div>
    );
  }
);

CertificateTemplateModern.displayName = 'CertificateTemplateModern';
