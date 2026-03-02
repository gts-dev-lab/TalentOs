'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, FileCheck2, PackageCheck, PlusCircle } from 'lucide-react';
import JSZip from 'jszip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';

type ScormPreview = {
  title: string;
  modules: string[];
};

export default function ScormImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<ScormPreview | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
    }
  };

  const handleParsePackage = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona un archivo .zip para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);
    setPreview(null);
    try {
      const zip = await JSZip.loadAsync(file);
      const manifestFile = zip.file('imsmanifest.xml');
      if (!manifestFile) {
        throw new Error(
          'El archivo imsmanifest.xml no se encontró en el paquete. Asegúrate de que es un paquete SCORM válido.'
        );
      }
      const manifestText = await manifestFile.async('text');

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(manifestText, 'application/xml');

      const errorNode = xmlDoc.querySelector('parsererror');
      if (errorNode) {
        throw new Error('Error al procesar el archivo imsmanifest.xml.');
      }

      const title =
        xmlDoc.querySelector('organization > title')?.textContent || file.name.replace('.zip', '');
      const resourceNodes = xmlDoc.querySelectorAll("resource[scormtype='sco']");

      if (resourceNodes.length === 0) {
        throw new Error(
          'No se encontraron recursos de tipo SCO en el manifiesto. El paquete puede no ser un curso interactivo.'
        );
      }

      const modules = Array.from(resourceNodes).map(node => {
        const itemIdentifier = node.getAttribute('identifier');
        const itemNode = xmlDoc.querySelector(`item[identifierref='${itemIdentifier}'] > title`);
        return itemNode?.textContent || node.getAttribute('href') || 'Módulo sin nombre';
      });

      setPreview({ title, modules });
      toast({
        title: 'Paquete procesado',
        description: 'Se ha leído la estructura del curso SCORM.',
      });
    } catch (err: any) {
      toast({ title: 'Error al Procesar', description: err.message, variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!preview || !file) return;
    setIsSaving(true);

    try {
      const newCourseData = {
        title: preview.title,
        description: `Curso importado desde el paquete SCORM: ${file.name}`,
        longDescription: `Este curso ha sido importado desde un paquete SCORM. El contenido se reproduce a través del visor SCORM de la plataforma. El paquete contiene ${preview.modules.length} módulos.`,
        instructor: 'Instructor SCORM',
        duration: 'Variable',
        modality: 'Online' as const,
        image: '/images/default.png',
        aiHint: 'scorm elearning',
        isScorm: true,
        scormPackage: file, // Store the blob
        modules: preview.modules.map((title, i) => ({
          id: `scorm_mod_${Date.now()}_${i}`,
          title,
          duration: 'Variable',
          content: `Contenido del módulo ${i + 1} cargado desde SCORM.`,
        })),
      };

      const newCourseId = await db.addCourse(newCourseData);

      toast({
        title: 'Curso Importado',
        description:
          'El curso SCORM se ha guardado como borrador. Ahora puedes editarlo y publicarlo.',
      });

      router.push(`/dashboard/courses/${newCourseId}/edit`);
    } catch (error) {
      console.error('Failed to save SCORM course', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el curso importado.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/courses/create">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Opciones
        </Link>
      </Button>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Upload /> Importar Paquete SCORM
          </CardTitle>
          <CardDescription>
            Sube un paquete SCORM (.zip) para añadir un curso a la plataforma. El sistema leerá el
            manifiesto y creará la estructura del curso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border-2 border-dashed rounded-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scorm-file">1. Selecciona el archivo del paquete SCORM</Label>
              <Input id="scorm-file" type="file" accept=".zip" onChange={handleFileChange} />
              {file && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-green-500" /> Archivo seleccionado:{' '}
                  {file.name}
                </p>
              )}
            </div>
            <Button onClick={handleParsePackage} disabled={!file || isParsing}>
              {isParsing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="mr-2 h-4 w-4" />
              )}
              2. Procesar Paquete
            </Button>
          </div>

          {preview && (
            <div className="p-6 border rounded-lg bg-muted/50 space-y-4">
              <h3 className="text-lg font-semibold">3. Vista Previa del Curso</h3>
              <div className="space-y-2">
                <p>
                  <strong>Título:</strong> {preview.title}
                </p>
                <p>
                  <strong>Módulos Encontrados:</strong>
                </p>
                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                  {preview.modules.map((mod, i) => (
                    <li key={i}>{mod}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCourse} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Guardar Curso como Borrador
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
