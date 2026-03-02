'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle, ArrowLeft, Upload } from 'lucide-react';
import * as db from '@/lib/db';
import type { AIConfig, CertificateTemplateType, Course, User, UserProgress } from '@/lib/types';
import { certificateTemplates } from '@/lib/types';
import { CertificateTemplate } from '@/components/certificate-template';
import { CertificateTemplateModern } from '@/components/certificate-template-modern';
import { CertificateTemplateProfessional } from '@/components/certificate-template-professional';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CertificatesSettingsPage() {
  const { toast } = useToast();
  const currentConfig = useLiveQuery(() => db.getAIConfig());
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);
  const allUsers = useLiveQuery(() => db.getAllUsers(), []);
  const allProgress = useLiveQuery(() => db.db.userProgress.toArray(), []);

  const [localConfig, setLocalConfig] = useState<AIConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State for the generator
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [completableStudents, setCompletableStudents] = useState<User[]>([]);

  useEffect(() => {
    if (currentConfig) {
      setLocalConfig(currentConfig);
    }
  }, [currentConfig]);

  useEffect(() => {
    if (!selectedCourseId || !allProgress || !allCourses || !allUsers) {
      setCompletableStudents([]);
      setSelectedUserId(null); // Reset user when course changes
      return;
    }

    const course = allCourses.find(c => c.id === selectedCourseId);
    if (!course || !course.modules || course.modules.length === 0) {
      setCompletableStudents([]);
      return;
    }

    const courseProgress = allProgress.filter(p => p.courseId === selectedCourseId);
    const completedUserIds = courseProgress
      .filter(p => p.completedModules.length === course.modules.length)
      .map(p => p.userId);

    const students = allUsers.filter(u => completedUserIds.includes(u.id));
    setCompletableStudents(students);
  }, [selectedCourseId, allProgress, allCourses, allUsers]);

  const handleSaveTemplate = async () => {
    if (!localConfig) return;
    setIsSaving(true);
    try {
      await db.saveAIConfig(localConfig);
      toast({
        title: 'Ajustes Guardados',
        description: 'La plantilla de certificado por defecto ha sido guardada.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los ajustes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedUser = useMemo(
    () => allUsers?.find(u => u.id === selectedUserId),
    [selectedUserId, allUsers]
  );
  const selectedCourse = useMemo(
    () => allCourses?.find(c => c.id === selectedCourseId),
    [selectedCourseId, allCourses]
  );

  const certificateProps = useMemo(() => {
    return {
      userName: selectedUser?.name || 'Elena Vargas',
      courseName: selectedCourse?.title || 'Soporte Vital Básico (SVB) y DEA',
      completionDate: format(new Date(), 'dd/MM/yyyy'),
      instructorName: selectedCourse?.instructor || 'Dr. Alejandro Torres',
      qrCodeDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 black pixel
    };
  }, [selectedUser, selectedCourse]);

  if (!localConfig || !allCourses) {
    return <Skeleton className="h-[80vh] w-full" />;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/settings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Ajustes
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Gestión de Certificados</h1>
        <p className="text-muted-foreground">
          Genera, previsualiza y gestiona las plantillas de certificados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generador de Certificados</CardTitle>
          <CardDescription>
            Selecciona un curso y un alumno que lo haya completado para generar una vista previa.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select onValueChange={setSelectedCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="1. Selecciona un curso..." />
            </SelectTrigger>
            <SelectContent>
              {allCourses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={setSelectedUserId}
            disabled={!selectedCourseId || completableStudents.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="2. Selecciona un alumno..." />
            </SelectTrigger>
            <SelectContent>
              {completableStudents.length > 0 ? (
                completableStudents.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  {selectedCourseId
                    ? 'Nadie ha completado este curso'
                    : 'Selecciona un curso primero'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plantilla por Defecto</CardTitle>
          <CardDescription>
            Selecciona el diseño que se usará para todos los certificados generados en la
            plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-auto md:max-w-xs space-y-2 flex-grow">
            <Select
              value={localConfig.defaultCertificateTemplate}
              onValueChange={(value: CertificateTemplateType) =>
                setLocalConfig(prev => ({ ...prev!, defaultCertificateTemplate: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {certificateTemplates.map(template => (
                  <SelectItem key={template} value={template}>
                    Diseño {template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Guardar Plantilla
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Importar Certificado
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <h2 className="text-2xl font-semibold">Vistas Previas de las Plantillas</h2>

        {/* Modern Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Diseño Moderno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 scale-[0.6] origin-top-left certificate-scale-container">
                <CertificateTemplateModern {...certificateProps} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Diseño Profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 scale-[0.6] origin-top-left certificate-scale-container">
                <CertificateTemplateProfessional {...certificateProps} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classic Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Diseño Clásico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 scale-[0.6] origin-top-left certificate-scale-container">
                <CertificateTemplate {...certificateProps} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
