
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import JSZip from 'jszip';
import { Loader2, ArrowLeft, Tv, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { Course } from '@/lib/types';
import { createScormApi, installScormApi, uninstallScormApi } from '@/lib/scorm-api';
import { scormCmiStateToCmi, cmiToScormCmiState } from '@/lib/scorm-cmi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ScormPlayerPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleCompleteCourse = useCallback(async () => {
    if (!user || !course || !course.modules || isCompleting) return;

    setIsCompleting(true);
    try {
      for (const mod of course.modules) {
        await db.markModuleAsCompleted(user.id, course.id, mod.id);
      }
      toast({
        title: '¡Curso Completado!',
        description: `Has completado "${course.title}".`,
      });
      router.push(`/dashboard/courses/${courseId}`);
    } catch (error) {
      console.error('Failed to complete SCORM course', error);
      toast({ title: 'Error', description: 'No se pudo registrar la finalización del curso.', variant: 'destructive' });
    } finally {
      setIsCompleting(false);
    }
  }, [user, course, courseId, router, toast, isCompleting]);

  useEffect(() => {
    if (courseId) {
      db.getCourseById(courseId).then(data => {
        setCourse(data || null);
      }).catch(err => {
        setError("No se pudo cargar el curso.");
        console.error(err);
      });
    }
  }, [courseId]);

  useEffect(() => {
    if (!course || !user) return;
    if (!course.isScorm || !course.scormPackage) {
      setError("Este curso no es un paquete SCORM válido.");
      setIsLoading(false);
      return;
    }

    const urlRef = { current: null as string | null };
    const setupScormPlayer = async () => {
      try {
        const zip = await JSZip.loadAsync(course.scormPackage!);
        const manifestFile = zip.file("imsmanifest.xml");
        if (!manifestFile) throw new Error("Manifest (imsmanifest.xml) no encontrado en el paquete.");
        const manifestText = await manifestFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(manifestText, "application/xml");
        const resourceNode = xmlDoc.querySelector("resource[scormtype='sco']");
        const launchFileHref = resourceNode?.getAttribute("href");
        if (!launchFileHref) throw new Error("No se encontró el archivo de lanzamiento en el manifiesto.");
        const launchFile = zip.file(launchFileHref);
        if (!launchFile) throw new Error(`El archivo de lanzamiento '${launchFileHref}' no existe en el paquete.`);
        const launchBlob = await launchFile.async("blob");
        const url = URL.createObjectURL(launchBlob);
        urlRef.current = url;
        setLaunchUrl(url);
      } catch (err) {
        setError((err as Error).message);
        console.error("Error setting up SCORM player:", err);
      } finally {
        setIsLoading(false);
      }
    };

    let cancelled = false;
    (async () => {
      const state = await db.getScormCmiState(user.id, course.id);
      if (cancelled) return;
      const initialCmi = state ? scormCmiStateToCmi(state) : undefined;
      const scormApi = createScormApi({
        initialCmi,
        studentName: user.name || 'Student',
        onTerminate: (cmi) => {
          const status = (cmi['cmi.completion_status'] ?? cmi['cmi.core.lesson_status']) as string;
          if (status === 'completed' || status === 'passed') {
            handleCompleteCourse();
          }
        },
        onCommit: (cmi) => {
          const data = cmiToScormCmiState(user.id, course.id, cmi);
          db.saveScormCmiState(user.id, course.id, data).catch(() => {});
        },
      });
      installScormApi(typeof window !== 'undefined' ? window : ({} as Window), scormApi);
      await setupScormPlayer();
    })();

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') uninstallScormApi(window);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [course, handleCompleteCourse, user]);


  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }
  
  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
       <div className="flex-shrink-0">
         <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la Descripción
            </Link>
        </Button>
       </div>

      <div className="flex-grow flex flex-col border-2 border-dashed rounded-lg p-4">
        {error ? (
           <div className="m-auto text-center text-destructive">
             <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
             <h2 className="text-xl font-bold">Error al Cargar el Curso</h2>
             <p>{error}</p>
           </div>
        ) : launchUrl ? (
          <iframe
            ref={iframeRef}
            src={launchUrl}
            title={course?.title || 'SCORM Content'}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        ) : (
           <div className="m-auto text-center">
             <Tv className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
             <h2 className="text-xl font-bold">Preparando Visor SCORM...</h2>
           </div>
        )}
      </div>
    </div>
  );
}
