import React from 'react';
import { AppLogo } from '@/components/icons';
import { CheckCircle } from 'lucide-react';

interface CertificateTemplateProps {
  userName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  qrCodeDataUrl: string;
}

export const CertificateTemplateProfessional = React.forwardRef<
  HTMLDivElement,
  CertificateTemplateProps
>(({ userName, courseName, completionDate, instructorName, qrCodeDataUrl }, ref) => {
  return (
    <div
      ref={ref}
      className="w-[1123px] h-[794px] bg-white text-gray-900 font-sans flex relative overflow-hidden"
    >
      {/* Left blue decorative bar */}
      <div className="w-24 bg-primary flex-shrink-0"></div>

      <div className="flex-grow flex flex-col p-16">
        <header className="flex justify-between items-start">
          <div>
            <p className="text-2xl font-light text-gray-500 tracking-widest">CERTIFICADO DE</p>
            <p className="text-4xl font-bold text-primary tracking-wider">FINALIZACIÓN</p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <span className="text-xl font-semibold">TalentOS</span>
            <AppLogo className="h-10 w-10 text-primary" />
          </div>
        </header>

        <main className="flex-grow flex flex-col justify-center my-8">
          <p className="text-lg text-gray-600 mb-2">Otorgado a</p>
          <h1 className="text-6xl font-bold text-gray-800">{userName}</h1>
          <p className="text-lg text-gray-600 mt-8">por la exitosa finalización del curso</p>
          <h2 className="text-4xl font-semibold text-primary mt-2">{courseName}</h2>
        </main>

        <footer className="flex justify-between items-end text-sm mt-auto">
          <div className="text-left">
            <p className="font-semibold text-lg">{instructorName}</p>
            <p className="text-gray-500 border-t-2 border-primary mt-1 pt-1">
              Instructor Principal
            </p>
          </div>
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          </div>
          <div className="flex items-center gap-4">
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="Código QR de Verificación" className="h-24 w-24" />
            )}
            <div className="text-right">
              <p className="font-semibold text-lg">{completionDate}</p>
              <p className="text-gray-500 border-t-2 border-primary mt-1 pt-1">Fecha de Emisión</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
});

CertificateTemplateProfessional.displayName = 'CertificateTemplateProfessional';
