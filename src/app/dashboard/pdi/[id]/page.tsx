'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Loader2,
  Target,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Archive,
  Edit,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { IndividualDevelopmentPlan, Course } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig: Record<
  IndividualDevelopmentPlan['status'],
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    icon: typeof CheckCircle2;
  }
> = {
  draft: { label: 'Borrador', variant: 'outline', icon: Clock },
  active: { label: 'Activo', variant: 'default', icon: CheckCircle2 },
  completed: { label: 'Completado', variant: 'secondary', icon: CheckCircle2 },
  archived: { label: 'Archivado', variant: 'outline', icon: Archive },
};

export default function PDIDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  // Milestone dialog functionality can be added later
  const [reviewProgress, setReviewProgress] = useState(50);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewNextSteps, setReviewNextSteps] = useState('');

  const pdi = useLiveQuery(() => db.getPDIById(id), [id]);
  const users = useLiveQuery(() => db.getAllUsers(), []);
  const courses = useLiveQuery(() => db.getAllCourses(), []);
  const userProgress = useLiveQuery(
    () => (user ? db.getUserProgressForUser(user.id) : Promise.resolve([])),
    [user?.id]
  );

  const usersById = useMemo(() => new Map((users || []).map(u => [u.id, u])), [users]);
  const coursesById = useMemo(() => new Map((courses || []).map(c => [c.id, c])), [courses]);
  const progressByCourse = useMemo(() => {
    const map = new Map<string, number>();
    (userProgress || []).forEach(p => {
      const course = coursesById.get(p.courseId);
      if (course) {
        const percentage = Math.round((p.completedModules.length / course.modules.length) * 100);
        map.set(p.courseId, percentage);
      }
    });
    return map;
  }, [userProgress, coursesById]);

  const isManager =
    user && ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);
  const canEdit = isManager && pdi && pdi.managerId === user.id;

  if (!user || pdi === undefined || users === undefined || courses === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!pdi) {
    return (
      <div className="space-y-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/pdi">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a PDI
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>PDI no encontrado</CardTitle>
            <CardDescription>
              El Plan de Desarrollo Individual solicitado no existe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const employee = usersById.get(pdi.userId);
  const manager = usersById.get(pdi.managerId);
  const statusInfo = statusConfig[pdi.status];
  const StatusIcon = statusInfo.icon;

  const handleAddReview = async () => {
    if (!user || !pdi) return;
    try {
      await db.addPDIReview(pdi.id, {
        reviewDate: new Date().toISOString(),
        reviewerId: user.id,
        reviewerName: user.name,
        progress: reviewProgress,
        feedback: reviewFeedback,
        nextSteps: reviewNextSteps || undefined,
      });
      toast({
        title: 'Revisión añadida',
        description: 'La revisión ha sido registrada exitosamente.',
      });
      setReviewDialogOpen(false);
      setReviewFeedback('');
      setReviewNextSteps('');
      setReviewProgress(50);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir la revisión.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    if (!pdi) return;
    const milestone = pdi.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    try {
      await db.updatePDIMilestone(pdi.id, milestoneId, {
        completed: !milestone.completed,
        completedAt: !milestone.completed ? new Date().toISOString() : undefined,
      });
      toast({
        title: 'Hito actualizado',
        description: milestone.completed
          ? 'Hito marcado como pendiente'
          : 'Hito marcado como completado',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el hito.',
        variant: 'destructive',
      });
    }
  };

  const completedMilestones = pdi.milestones.filter(m => m.completed).length;
  const totalMilestones = pdi.milestones.length;
  const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/pdi">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a PDI
          </Link>
        </Button>
        {canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/pdi/${pdi.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{pdi.title}</CardTitle>
                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </div>
              {pdi.description && (
                <CardDescription className="mt-1">{pdi.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {employee && (
              <div>
                <span className="text-sm text-muted-foreground">Empleado</span>
                <p className="font-medium">{employee.name}</p>
              </div>
            )}
            {manager && (
              <div>
                <span className="text-sm text-muted-foreground">Manager</span>
                <p className="font-medium">{manager.name}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Inicio</span>
              <p className="font-medium">
                {format(new Date(pdi.startDate), 'PPP', { locale: es })}
              </p>
            </div>
            {pdi.endDate && (
              <div>
                <span className="text-sm text-muted-foreground">Fin</span>
                <p className="font-medium">
                  {format(new Date(pdi.endDate), 'PPP', { locale: es })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="milestones">Hitos</TabsTrigger>
          <TabsTrigger value="reviews">Revisiones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progreso de Cursos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pdi.courseIds.map(courseId => {
                    const course = coursesById.get(courseId);
                    const progress = progressByCourse.get(courseId) || 0;
                    return (
                      <div key={courseId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{course?.title || 'Curso desconocido'}</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progreso de Hitos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hitos completados</span>
                    <span className="font-medium">
                      {completedMilestones}/{totalMilestones}
                    </span>
                  </div>
                  <Progress value={milestoneProgress} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="objectives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos de Desarrollo</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {pdi.objectives.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {pdi.courseIds.map(courseId => {
              const course = coursesById.get(courseId);
              const progress = progressByCourse.get(courseId) || 0;
              if (!course) return null;
              return (
                <Card key={courseId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <Link href={`/dashboard/courses/${courseId}`}>Ver curso</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hitos del Plan</CardTitle>
                {/* Add milestone functionality can be added later */}
              </div>
            </CardHeader>
            <CardContent>
              {pdi.milestones.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay hitos definidos aún.
                </p>
              ) : (
                <div className="space-y-4">
                  {pdi.milestones.map(milestone => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <button
                        onClick={() => canEdit && handleToggleMilestone(milestone.id)}
                        disabled={!canEdit}
                        className={cn(
                          'mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                          milestone.completed
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground',
                          canEdit && 'cursor-pointer hover:border-primary'
                        )}
                      >
                        {milestone.completed && <Check className="h-3 w-3" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4
                              className={cn(
                                'font-medium',
                                milestone.completed && 'line-through text-muted-foreground'
                              )}
                            >
                              {milestone.title}
                            </h4>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {milestone.description}
                              </p>
                            )}
                            {milestone.targetDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Objetivo:{' '}
                                {format(new Date(milestone.targetDate), 'PPP', { locale: es })}
                              </p>
                            )}
                            {milestone.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completado:{' '}
                                {format(new Date(milestone.completedAt), 'PPP', { locale: es })}
                              </p>
                            )}
                            {milestone.notes && (
                              <p className="text-sm mt-2 italic">{milestone.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revisiones del Plan</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setReviewDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Revisión
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pdi.reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aún no hay revisiones registradas.
                </p>
              ) : (
                <div className="space-y-4">
                  {pdi.reviews.map(review => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{review.reviewerName}</CardTitle>
                            <CardDescription>
                              {format(new Date(review.reviewDate), 'PPP', { locale: es })}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">{review.progress}%</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Progreso</Label>
                          <Progress value={review.progress} className="mt-2" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Feedback</Label>
                          <p className="text-sm mt-1">{review.feedback}</p>
                        </div>
                        {review.nextSteps && (
                          <div>
                            <Label className="text-sm font-medium">Próximos Pasos</Label>
                            <p className="text-sm mt-1">{review.nextSteps}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Revisión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Progreso General (%)</Label>
              <div className="space-y-2 mt-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewProgress}
                  onChange={e => setReviewProgress(Number(e.target.value))}
                />
                <Progress value={reviewProgress} />
              </div>
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea
                placeholder="Describe el progreso y observaciones..."
                value={reviewFeedback}
                onChange={e => setReviewFeedback(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Próximos Pasos (opcional)</Label>
              <Textarea
                placeholder="Indica los próximos pasos a seguir..."
                value={reviewNextSteps}
                onChange={e => setReviewNextSteps(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddReview} disabled={!reviewFeedback.trim()}>
              Guardar Revisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
