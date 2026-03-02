import React from 'react';
import { AppLogo } from '@/components/icons';

interface CertificateTemplateProps {
  userName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  qrCodeDataUrl: string;
}

export const CertificateTemplate = React.forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ userName, courseName, completionDate, instructorName, qrCodeDataUrl }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[1123px] h-[794px] p-12 bg-white text-gray-800 font-serif flex flex-col justify-between"
      >
        {/* Using a fixed size for A4 landscape ratio */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-4">
            <AppLogo className="h-16 w-16 text-primary" />
            <h1 className="text-5xl font-bold text-gray-700" style={{ fontFamily: 'serif' }}>
              Talentos
            </h1>
          </div>
          <p className="mt-4 text-2xl">Certificado de Finalización</p>
        </div>

        <div className="text-center my-8">
          <p className="text-xl">Se certifica que</p>
          <p className="text-4xl font-bold text-primary my-4 tracking-wider">{userName}</p>
          <p className="text-xl">ha completado satisfactoriamente la formación</p>
          <p className="text-3xl font-semibold mt-4">"{courseName}"</p>
        </div>

        <div className="flex justify-between items-end mt-auto text-center">
          <div>
            <p className="border-t-2 border-gray-400 pt-2 text-lg font-semibold">
              {instructorName}
            </p>
            <p className="text-sm">Instructor Jefe</p>
          </div>
          <div>
            <p className="text-lg">{completionDate}</p>
            <p className="text-sm border-t-2 border-gray-400 pt-2">Fecha de finalización</p>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="border-t-2 border-gray-400 pt-2 text-lg font-semibold">
                Lucía Fernández
              </p>
              <p className="text-sm">Jefa de Formación</p>
            </div>
            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="h-24 w-24" />}
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';
