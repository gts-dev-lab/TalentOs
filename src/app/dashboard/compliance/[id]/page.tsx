'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { Regulation, RegulationCompliance, User, Course } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addMonths, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const typeColors: Record<Regulation['type'], string> = {
  ISO: 'bg-blue-500',
  PRL: 'bg-red-500',
  GDPR: 'bg-purple-500',
  LOPD: 'bg-green-500',
  Ley: 'bg-orange-500',
  Normativa: 'bg-yellow-500',
  Certificación: 'bg-indigo-500',
  Otro: 'bg-gray-500',
};

export default function RegulationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [complianceDialogOpen, setComplianceDialogOpen] = useState(false);
  const [complianceUserId, setComplianceUserId] = useState<string>('');
  const [complianceDate, setComplianceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [complianceNotes, setComplianceNotes] = useState<string>('');

  const regulation = useLiveQuery(() => db.getRegulationById(id), [id]);
  const allUsers = useLiveQuery(() => db.getAllUsers(), []);
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);
  const allCompliance = useLiveQuery(
    () => (regulation ? db.getComplianceForRegulation(regulation.id) : Promise.resolve([])),
    [regulation?.id]
  );
  const allAudits = useLiveQuery(
    () => (regulation ? db.getAuditsForRegulation(regulation.id) : Promise.resolve([])),
    [regulation?.id]
  );

  const isManager =
    user && ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);

  const usersById = useMemo(() => new Map((allUsers || []).map(u => [u.id, u])), [allUsers]);
  const coursesById = useMemo(() => new Map((allCourses || []).map(c => [c.id, c])), [allCourses]);

  const applicableUsers = useMemo(() => {
    if (!regulation || !allUsers) return [];
    return allUsers.filter(
      u =>
        u.status === 'approved' &&
        regulation.applicableRoles.includes(u.role) &&
        (!regulation.applicableDepartments ||
          regulation.applicableDepartments.length === 0 ||
          regulation.applicableDepartments.includes(u.department))
    );
  }, [regulation, allUsers]);

  const complianceByUser = useMemo(() => {
    const map = new Map<string, RegulationCompliance>();
    (allCompliance || []).forEach(comp => {
      map.set(comp.userId, comp);
    });
    return map;
  }, [allCompliance]);

  const complianceStats = useMemo(() => {
    if (!regulation || !applicableUsers.length)
      return { total: 0, compliant: 0, nonCompliant: 0, expiring: 0, rate: 0 };
    const total = applicableUsers.length;
    const compliant = applicableUsers.filter(u => complianceByUser.has(u.id!)).length;
    const nonCompliant = total - compliant;
    const expiring = (allCompliance || []).filter(comp => {
      if (!comp.expirationDate) return false;
      const expDate = new Date(comp.expirationDate);
      const today = new Date();
      const daysUntilExpiry = differenceInDays(expDate, today);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;
    return {
      total,
      compliant,
      nonCompliant,
      expiring,
      rate: total > 0 ? (compliant / total) * 100 : 0,
    };
  }, [regulation, applicableUsers, complianceByUser, allCompliance]);

  if (!user || !isManager) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>No tienes permisos para acceder a esta sección.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (
    !regulation ||
    allUsers === undefined ||
    allCourses === undefined ||
    allCompliance === undefined ||
    allAudits === undefined
  ) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddCompliance = async () => {
    if (!complianceUserId || !user) return;
    try {
      const expirationDate = regulation.validityPeriod
        ? addMonths(new Date(complianceDate), regulation.validityPeriod).toISOString()
        : undefined;

      await db.addRegulationCompliance({
        userId: complianceUserId,
        regulationId: regulation.id,
        complianceDate,
        expirationDate,
        notes: complianceNotes || undefined,
      });
      toast({
        title: 'Cumplimiento Registrado',
        description: 'El cumplimiento ha sido registrado exitosamente.',
      });
      setComplianceDialogOpen(false);
      setComplianceUserId('');
      setComplianceDate(new Date().toISOString().split('T')[0]);
      setComplianceNotes('');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el cumplimiento.',
        variant: 'destructive',
      });
    }
  };

  const getComplianceStatus = (comp: RegulationCompliance | undefined) => {
    if (!comp) return { status: 'non-compliant', label: 'No Cumplido', color: 'destructive' };
    if (!comp.expirationDate) return { status: 'compliant', label: 'Cumplido', color: 'default' };
    const expDate = new Date(comp.expirationDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expDate, today);
    if (daysUntilExpiry < 0) return { status: 'expired', label: 'Vencido', color: 'destructive' };
    if (daysUntilExpiry <= 30)
      return { status: 'expiring', label: `Vence en ${daysUntilExpiry} días`, color: 'secondary' };
    return { status: 'compliant', label: 'Cumplido', color: 'default' };
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/compliance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Compliance
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/compliance/${regulation.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{regulation.name}</CardTitle>
                <Badge className={typeColors[regulation.type]}>{regulation.type}</Badge>
                {regulation.isActive ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Activa
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactiva
                  </Badge>
                )}
              </div>
              <CardDescription>
                <div className="mt-1">
                  <span className="font-medium">Código:</span> {regulation.code}
                </div>
                {regulation.description && <p className="mt-2">{regulation.description}</p>}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <span className="text-sm text-muted-foreground">Roles aplicables</span>
              <p className="font-medium">{regulation.applicableRoles.length}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cursos asociados</span>
              <p className="font-medium">{regulation.courseIds.length}</p>
            </div>
            {regulation.requiresRenewal && (
              <>
                <div>
                  <span className="text-sm text-muted-foreground">Validez</span>
                  <p className="font-medium">
                    {regulation.validityPeriod ? `${regulation.validityPeriod} meses` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Renovación</span>
                  <p className="font-medium">
                    {regulation.renewalPeriod ? `Cada ${regulation.renewalPeriod} meses` : 'N/A'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado de Cumplimiento</CardTitle>
              <CardDescription>Resumen del cumplimiento de esta normativa</CardDescription>
            </div>
            <Button size="sm" onClick={() => setComplianceDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Cumplimiento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Aplicable</div>
              <div className="text-2xl font-bold">{complianceStats.total}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Cumplido</div>
              <div className="text-2xl font-bold text-green-600">{complianceStats.compliant}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">No Cumplido</div>
              <div className="text-2xl font-bold text-red-600">{complianceStats.nonCompliant}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tasa de Cumplimiento</div>
              <div className="text-2xl font-bold">{complianceStats.rate.toFixed(1)}%</div>
            </div>
          </div>
          <Progress value={complianceStats.rate} className="mb-4" />
          {complianceStats.expiring > 0 && (
            <div className="flex items-center gap-2 text-orange-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {complianceStats.expiring} cumplimiento(s) próximo(s) a vencer
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compliance">Cumplimiento por Usuario</TabsTrigger>
          <TabsTrigger value="courses">Cursos Asociados</TabsTrigger>
          <TabsTrigger value="audits">Auditorías</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cumplimiento por Usuario</CardTitle>
              <CardDescription>Estado de cumplimiento de cada usuario aplicable</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Cumplimiento</TableHead>
                    <TableHead>Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicableUsers.map(u => {
                    const comp = complianceByUser.get(u.id!);
                    const status = getComplianceStatus(comp);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>{u.department}</TableCell>
                        <TableCell>
                          <Badge variant={status.color as any}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {comp?.complianceDate
                            ? format(new Date(comp.complianceDate), 'PPP', { locale: es })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {comp?.expirationDate
                            ? format(new Date(comp.expirationDate), 'PPP', { locale: es })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {regulation.courseIds.map(courseId => {
              const course = coursesById.get(courseId);
              if (!course) return null;
              return (
                <Card key={courseId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/dashboard/courses/${courseId}`}>Ver curso</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            {regulation.courseIds.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay cursos asociados a esta normativa.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Auditorías de Cumplimiento</CardTitle>
                  <CardDescription>
                    Registro de auditorías realizadas para esta normativa
                  </CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/compliance/${regulation.id}/audit/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Auditoría
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allAudits.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay auditorías registradas aún.
                </p>
              ) : (
                <div className="space-y-4">
                  {allAudits.map(audit => (
                    <Card key={audit.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{audit.auditorName}</CardTitle>
                            <CardDescription>
                              {format(new Date(audit.auditDate), 'PPP', { locale: es })}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">{audit.complianceRate.toFixed(0)}%</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Alcance</Label>
                          <p className="text-sm mt-1">{audit.scope}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Hallazgos</Label>
                          <p className="text-sm mt-1">{audit.findings}</p>
                        </div>
                        {audit.recommendations && (
                          <div>
                            <Label className="text-sm font-medium">Recomendaciones</Label>
                            <p className="text-sm mt-1">{audit.recommendations}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium">Usuarios No Cumplidores</Label>
                          <p className="text-sm mt-1">
                            {audit.nonCompliantUserIds.length > 0
                              ? audit.nonCompliantUserIds
                                  .map(id => usersById.get(id)?.name)
                                  .filter(Boolean)
                                  .join(', ')
                              : 'Ninguno'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={complianceDialogOpen} onOpenChange={setComplianceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Cumplimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Usuario</Label>
              <Select value={complianceUserId} onValueChange={setComplianceUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {applicableUsers
                    .filter(u => !complianceByUser.has(u.id!))
                    .map(u => (
                      <SelectItem key={u.id} value={u.id!}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha de Cumplimiento</Label>
              <Input
                type="date"
                value={complianceDate}
                onChange={e => setComplianceDate(e.target.value)}
              />
            </div>
            {regulation.validityPeriod && (
              <div className="text-sm text-muted-foreground">
                El cumplimiento vencerá el{' '}
                {format(addMonths(new Date(complianceDate), regulation.validityPeriod), 'PPP', {
                  locale: es,
                })}
              </div>
            )}
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Notas adicionales sobre el cumplimiento..."
                value={complianceNotes}
                onChange={e => setComplianceNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComplianceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCompliance} disabled={!complianceUserId || !complianceDate}>
              Registrar Cumplimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
