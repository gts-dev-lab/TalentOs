
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle, Clock, Bot, Loader2, Sparkles, Send, PlusCircle, CheckCircle2, XCircle, MessageSquare, Book, File, Video, Link as LinkIcon, FilePenLine, AlertTriangle, Pencil, Rocket, EyeOff, Archive, Users, FileText, Star, CalendarDays, Users2, ChevronDown } from 'lucide-react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';
import { summarizeModuleContent } from '@/ai/flows/summarize-module-content';
import { downloadCourseAsScormZip } from '@/lib/scorm-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { CertificateTemplate } from '@/components/certificate-template';
import { CertificateTemplateModern } from '@/components/certificate-template-modern';
import { CertificateTemplateProfessional } from '@/components/certificate-template-professional';
import { Forum } from '@/components/forum';
import type { Course, AIConfig } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TestGenerator } from '@/components/course-detail/test-generator';
import { CourseChat } from '@/components/course-detail/course-chat';
import { CourseResources } from '@/components/course-detail/course-resources';
import { CourseManagementTab } from '@/components/course-detail/course-management-tab';
import { ScormLaunchPanel } from '@/components/course-detail/scorm-launch-panel';
import { RatingTab } from '@/components/course-detail/RatingTab';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

function LiveSessionsPanel({ courseId }: { courseId: string }) {
    const events = useLiveQuery(() => db.getCalendarEvents([courseId]), [courseId]);

    const upcomingEvents = events
        ?.filter(e => new Date(e.end) > new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    if (upcomingEvents === undefined) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (upcomingEvents.length === 0) {
        return null;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays /> Próximas Sesiones en Directo</CardTitle>
                <CardDescription>Enlaces para unirte a las clases y talleres programados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {upcomingEvents.map(event => (
                    <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border rounded-lg bg-muted/50">
                        <div>
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(event.start), "eeee, d 'de' MMMM 'de' HH:mm", { locale: es })}h
                            </p>
                        </div>
                        {event.videoCallLink ? (
                            <Button asChild>
                                <a href={event.videoCallLink} target="_blank" rel="noopener noreferrer">
                                    <Video className="mr-2 h-4 w-4" />
                                    Unirse a la Videollamada
                                </a>
                            </Button>
                        ) : (
                            <Button variant="outline" disabled>Enlace pendiente</Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}


export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [isDownloading, setIsDownloading] = useState<null | 'Clásico' | 'Moderno' | 'Profesional'>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExportingScorm, setIsExportingScorm] = useState(false);
  
  const certificateClassicRef = useRef<HTMLDivElement>(null);
  const certificateModernRef = useRef<HTMLDivElement>(null);
  const certificateProfessionalRef = useRef<HTMLDivElement>(null);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);

  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState<Record<string, boolean>>({});

  const aiConfig = useLiveQuery<AIConfig | undefined>(() => db.getAIConfig());
  
  const enrollmentCount = useLiveQuery(
    () => db.getApprovedEnrollmentCount(courseId),
    [courseId]
  );

  const fetchCourse = useCallback(async () => {
        setLoadingCourse(true);
        const courseData = await db.getCourseById(courseId);
        if (courseData) {
            setCourse(courseData);
        }
        setLoadingCourse(false);
    }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);
  
  const userProgress = useLiveQuery(
    () => (user ? db.getUserProgress(user.id, courseId) : undefined),
    [user?.id, courseId]
  );

  const certificate = useLiveQuery(
    () => (user ? db.getCertificateForUserCourse(user.id, courseId) : undefined),
    [user?.id, courseId]
  );
  
  const completedModules = useMemo(() => new Set(userProgress?.completedModules || []), [userProgress]);
  const progressPercentage = useMemo(() => {
    if (!course || !course.modules || course.modules.length === 0) return 0;
    return Math.round((completedModules.size / course.modules.length) * 100);
  }, [course, completedModules]);
  
  useEffect(() => {
    if (!user) return;
    const checkEnrollment = async () => {
        setIsCheckingEnrollment(true);
        const enrolledCourses = await db.getEnrolledCoursesForUser(user.id);
        const enrolled = enrolledCourses.some(c => c.id === courseId);
        setIsEnrolled(enrolled);
        setIsCheckingEnrollment(false);
    }
    checkEnrollment();
  }, [user, courseId]);

  useEffect(() => {
    if (user && course) {
        const verificationUrl = certificate
            ? `${window.location.origin}/certificates/verify?code=${certificate.verificationCode}`
            : `${window.location.origin}/dashboard/courses/${course.id}?userId=${user.id}`;
        QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' })
            .then(url => {
                setQrCodeDataUrl(url);
            })
            .catch(err => {
                console.error('Failed to generate QR code', err);
            });
    }
  }, [user, course, certificate]);


  if (loadingCourse) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  if (!course) {
    notFound();
  }
  
  const canFullyManage = user && (user.role === 'Administrador General' || user.role === 'Jefe de Formación');
  const isInstructor = user?.name === course.instructor;
  const canAccessForum = canFullyManage || isEnrolled;
  const canManageCourse = canFullyManage || isInstructor;
  const isMandatory = user && course.mandatoryForRoles?.includes(user.role);
  const isCourseFull = course.capacity !== undefined && enrollmentCount !== undefined && enrollmentCount >= course.capacity;


  const handleEnrollmentRequest = async () => {
    if (!user) return;
    try {
        await db.requestEnrollment(course.id, user.id);
        toast({
            title: "Solicitud enviada",
            description: "Tu solicitud de inscripción ha sido enviada para su aprobación.",
        });
    } catch (error: any) {
        console.error("Failed to request enrollment", error);
        toast({
            title: "Error en la Solicitud",
            description: error.message,
            variant: "destructive",
        })
    }
  }

  const handleMarkModuleAsCompleted = async (moduleId: string) => {
    if (!user) return;
    await db.markModuleAsCompleted(user.id, course.id, moduleId);
    // The useLiveQuery hook will automatically update the UI
  };
  
  const handleTogglePublishStatus = async () => {
    if (!canManageCourse) return;

    setIsPublishing(true);
    const newStatus = course.status === 'draft' ? 'published' : 'draft';
    try {
        await db.updateCourseStatus(course.id, newStatus);
        toast({
            title: `Curso ${newStatus === 'published' ? 'publicado' : 'ocultado'}`,
            description: `El curso ahora es ${newStatus === 'published' ? 'visible para los usuarios' : 'un borrador'}.`,
        });
        await fetchCourse(); // Re-fetch course data to update UI
    } catch (error) {
        console.error(`Failed to ${newStatus} course`, error);
        toast({ title: "Error", description: "No se pudo actualizar el estado del curso.", variant: "destructive" });
    } finally {
        setIsPublishing(false);
    }
  }

  const handleDownloadCertificate = async (type: 'Clásico' | 'Moderno' | 'Profesional') => {
      let certificateElement: HTMLDivElement | null = null;
      switch(type) {
        case 'Clásico':
            certificateElement = certificateClassicRef.current;
            break;
        case 'Moderno':
            certificateElement = certificateModernRef.current;
            break;
        case 'Profesional':
             certificateElement = certificateProfessionalRef.current;
            break;
      }
      if (!certificateElement || !user) return;
      
      setIsDownloading(type);
      try {
          const canvas = await html2canvas(certificateElement, {
              scale: 2, // Higher scale for better quality
              useCORS: true,
              backgroundColor: null,
          });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'px',
              format: [canvas.width, canvas.height]
          });
          
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save(`Certificado (${type}) - ${course.title}.pdf`);

      } catch (error) {
          console.error("Error generating certificate", error);
          toast({
              title: "Error",
              description: "No se pudo generar el certificado.",
              variant: "destructive",
          })
      } finally {
          setIsDownloading(null);
      }
  }

  const handleScormExport = async () => {
    if (!course) return;
    setIsExportingScorm(true);
    toast({
      title: 'Preparando paquete SCORM...',
      description: 'La descarga comenzará en breve.',
    });
    try {
      await downloadCourseAsScormZip(course);
    } catch (error) {
      console.error('Error exporting SCORM package:', error);
      toast({
        title: 'Error de Exportación',
        description: 'No se pudo generar el paquete SCORM.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingScorm(false);
    }
  };

  const handleGenerateSummary = async (moduleId: string, content: string) => {
    setSummaryLoading(prev => ({ ...prev, [moduleId]: true }));
    try {
      const result = await summarizeModuleContent(content);
      setSummaries(prev => ({ ...prev, [moduleId]: result.summary }));
    } catch (e: any) {
      console.error("Failed to generate summary", e);
      const description = e.message?.includes('API no está configurada')
          ? e.message
          : "No se pudo generar el resumen del módulo.";
      toast({
        title: "Error de IA",
        description,
        variant: "destructive"
      });
    } finally {
      setSummaryLoading(prev => ({ ...prev, [moduleId]: false }));
    }
  };


  return (
    <div className="space-y-8">
      {/* Hidden components for PDF generation */}
      <div className="absolute -z-10 -left-[9999px] top-0">
          {user && (
            <>
              <CertificateTemplate 
                  ref={certificateClassicRef}
                  userName={user.name}
                  courseName={course.title}
                  completionDate={format(new Date(), 'dd/MM/yyyy')}
                  instructorName={course.instructor}
                  qrCodeDataUrl={qrCodeDataUrl}
              />
               <CertificateTemplateModern
                  ref={certificateModernRef}
                  userName={user.name}
                  courseName={course.title}
                  completionDate={format(new Date(), 'dd/MM/yyyy')}
                  instructorName={course.instructor}
                  qrCodeDataUrl={qrCodeDataUrl}
              />
               <CertificateTemplateProfessional
                  ref={certificateProfessionalRef}
                  userName={user.name}
                  courseName={course.title}
                  completionDate={format(new Date(), 'dd/MM/yyyy')}
                  instructorName={course.instructor}
                  qrCodeDataUrl={qrCodeDataUrl}
              />
            </>
          )}
      </div>

       {canManageCourse && course.status === 'draft' && (
            <Alert variant="destructive" className="bg-yellow-50 border-yellow-300 text-yellow-800">
                <Pencil className="h-4 w-4 !text-yellow-800" />
                <AlertTitle>Modo Borrador</AlertTitle>
                <AlertDescription>
                    Este curso es un borrador y no es visible para los usuarios normales. Publícalo para que esté disponible en el catálogo.
                </AlertDescription>
            </Alert>
        )}

      <header className="relative h-64 w-full rounded-lg overflow-hidden">
        <Image src={course.image} alt={course.title} layout="fill" objectFit="cover" className="brightness-50" data-ai-hint={course.aiHint} />
        <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <Badge className="w-fit mb-2">{course.modality}</Badge>
            {isMandatory && <Badge variant="destructive" className="w-fit mb-2"><AlertTriangle className="h-3 w-3 mr-1.5" />Obligatorio</Badge>}
          </div>
          <h1 className="text-4xl font-bold text-white">{course.title}</h1>
          <div className="flex items-center gap-4 text-white/90">
            <p>Impartido por {course.instructor}</p>
             {course.capacity !== undefined && enrollmentCount !== undefined && (
                <>
                    <span className="text-white/50">•</span>
                    <div className="flex items-center gap-2">
                        <Users2 className="h-5 w-5" />
                        <span>{enrollmentCount} / {course.capacity} plazas</span>
                    </div>
                </>
            )}
          </div>
        </div>
      </header>

      <LiveSessionsPanel courseId={course.id} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {course.isScorm ? (
            <ScormLaunchPanel course={course} />
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <ScrollArea className="w-full whitespace-nowrap">
                <TabsList className="inline-flex w-max">
                  <TabsTrigger value="overview">Descripción</TabsTrigger>
                  <TabsTrigger value="modules">Módulos</TabsTrigger>
                  <TabsTrigger value="resources">Recursos</TabsTrigger>
                  <TabsTrigger value="ratings"><Star className="mr-2 h-4 w-4" />Valoraciones</TabsTrigger>
                  {aiConfig?.enabledFeatures.questionGeneration && <TabsTrigger value="test">Test IA</TabsTrigger>}
                  {aiConfig?.enabledFeatures.tutor && <TabsTrigger value="chat">Tutor IA</TabsTrigger>}
                  <TabsTrigger value="forum">Foro</TabsTrigger>
                  {canManageCourse && <TabsTrigger value="manage"><Users className="mr-2 h-4 w-4"/>Gestión</TabsTrigger>}
                </TabsList>
                 <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <TabsContent value="overview" className="mt-4">
      <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Sobre este curso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{course.longDescription}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="modules" className="mt-4">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Contenido del Curso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.modules && course.modules.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {course.modules.map((module) => {
                          const isCompleted = completedModules.has(module.id);
                          const isLoadingSummary = summaryLoading[module.id];
                          const summaryText = summaries[module.id];
                          return (
                            <AccordionItem value={module.id} key={module.id} className={cn("border rounded-lg", isCompleted && "bg-green-50 border-green-200")}>
                              <AccordionTrigger className="hover:no-underline p-4 w-full text-left">
                                <div className="flex items-center gap-4 flex-grow">
                                  <CheckCircle className={cn("h-6 w-6 text-muted-foreground transition-colors", isCompleted && "text-green-500")} />
                                  <div>
                                    <h3 className={cn("font-semibold", isCompleted && "line-through text-muted-foreground")}>{module.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />{module.duration}</p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4 px-4 pb-4">
                                <div className="pl-10"> {/* Aligns with title */}
                                  <p className="text-muted-foreground whitespace-pre-wrap mb-4">{module.content}</p>

                                  {summaryText ? (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                      <h4 className="font-semibold text-primary flex items-center gap-2"><Bot /> Resumen IA</h4>
                                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{summaryText}</p>
                                    </div>
                                  ) : aiConfig?.enabledFeatures.summarization ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGenerateSummary(module.id, module.content)}
                                        disabled={isLoadingSummary || !isEnrolled}
                                        title={!isEnrolled ? "Debes estar inscrito para usar la IA" : ""}
                                    >
                                        {isLoadingSummary ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Generar Resumen
                                    </Button>
                                  ) : null}
                                  
                                  <div className="flex justify-end mt-4">
                                    <Button 
                                        variant={isCompleted ? "link" : "default"}
                                        size="sm"
                                        className={cn(isCompleted && "text-green-600 font-semibold")}
                                        onClick={() => handleMarkModuleAsCompleted(module.id)}
                                        disabled={isCompleted || !isEnrolled}
                                    >
                                        {isCompleted ? "✓ Completado" : "Marcar como completado"}
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">Este curso todavía no tiene módulos definidos.</p>
                    )}
                    {!isEnrolled && user && course.modules && course.modules.length > 0 && (
                        <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mt-4">
                            Debes estar inscrito para marcar tu progreso y usar las funciones de IA.
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
               <TabsContent value="resources" className="mt-4">
                <CourseResources courseId={courseId} />
              </TabsContent>
              <TabsContent value="ratings" className="mt-4">
                <RatingTab course={course} user={user!} progress={progressPercentage} />
              </TabsContent>
              {aiConfig?.enabledFeatures.questionGeneration && (
                <TabsContent value="test" className="mt-4">
                  <TestGenerator courseTitle={course.title} courseContent={course.longDescription} studentName={user?.name || 'Estudiante'} aiConfig={aiConfig} />
                </TabsContent>
              )}
              {aiConfig?.enabledFeatures.tutor && (
                <TabsContent value="chat" className="mt-4">
                  <CourseChat courseTitle={course.title} courseContent={course.longDescription} />
                </TabsContent>
              )}
              <TabsContent value="forum" className="mt-4">
                {isCheckingEnrollment ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : canAccessForum && user ? (
                    <Forum courseId={course.id} user={user} canManage={!!canManageCourse} />
                ) : (
                    <Card className="shadow-lg">
                        <CardContent className="p-8 text-center">
                            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Acceso al Foro</h3>
                            <p className="mt-1 text-muted-foreground">Debes estar inscrito en este curso para ver y participar en las discusiones.</p>
                            {!isEnrolled && (
                              <Button className="mt-6" onClick={handleEnrollmentRequest}>
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Solicitar Inscripción
                              </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
             {canManageCourse && (
              <TabsContent value="manage" className="mt-4">
                <CourseManagementTab course={course} />
              </TabsContent>
             )}
            </Tabs>
          )}
        </div>
        <div className="space-y-8 lg:col-span-1">
           {!isEnrolled && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Inscripción</CardTitle>
                </CardHeader>
                <CardContent>
                    {isCourseFull && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Curso Completo</AlertTitle>
                            <AlertDescription>
                                No quedan plazas disponibles para este curso.
                            </AlertDescription>
                        </Alert>
                    )}
                    <Button className="w-full" onClick={handleEnrollmentRequest} disabled={isCourseFull}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Solicitar Inscripción
                    </Button>
                </CardContent>
              </Card>
           )}
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Tu Progreso</CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-center mt-2 text-sm text-muted-foreground">{progressPercentage}% completado</p>
            </CardContent>
            <CardFooter>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                        className="w-full" 
                        disabled={progressPercentage < 100 || !!isDownloading}
                    >
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {isDownloading ? `Generando ${isDownloading}...` : 'Descargar Certificado'}
                        <ChevronDown className="ml-2 h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuItem onSelect={() => handleDownloadCertificate('Clásico')} disabled={isDownloading === 'Clásico'}>
                        {isDownloading === 'Clásico' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Diseño Clásico {aiConfig?.defaultCertificateTemplate === 'Clásico' && <span className="text-xs text-muted-foreground ml-2">(Por defecto)</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleDownloadCertificate('Moderno')} disabled={isDownloading === 'Moderno'}>
                         {isDownloading === 'Moderno' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Diseño Moderno {aiConfig?.defaultCertificateTemplate === 'Moderno' && <span className="text-xs text-muted-foreground ml-2">(Por defecto)</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleDownloadCertificate('Profesional')} disabled={isDownloading === 'Profesional'}>
                         {isDownloading === 'Profesional' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Diseño Profesional {aiConfig?.defaultCertificateTemplate === 'Profesional' && <span className="text-xs text-muted-foreground ml-2">(Por defecto)</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
          {certificate && (
            <Card>
              <CardHeader>
                <CardTitle>Certificado Emitido</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/certificates/${certificate.id}`} className="text-sm text-primary hover:underline">
                  Ver certificado y descargar PDF
                </Link>
              </CardContent>
            </Card>
          )}
          {canManageCourse && (
              <Card>
                <CardHeader>
                    <CardTitle>Acciones de Gestión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button asChild className="w-full">
                        <Link href={`/dashboard/courses/${course.id}/edit`}>
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Editar Curso y Contenido
                        </Link>
                    </Button>
                    <Button
                        variant={course.status === 'draft' ? 'default' : 'secondary'}
                        className="w-full"
                        onClick={handleTogglePublishStatus}
                        disabled={isPublishing}
                    >
                        {isPublishing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : course.status === 'draft' ? (
                            <Rocket className="mr-2 h-4 w-4" />
                        ) : (
                            <EyeOff className="mr-2 h-4 w-4" />
                        )}
                        {course.status === 'draft' ? 'Publicar Curso' : 'Ocular Curso'}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleScormExport} disabled={isExportingScorm}>
                        {isExportingScorm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                        Exportar a SCORM
                    </Button>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
}
