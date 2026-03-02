'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Loader2,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { Regulation, RegulationType } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';

const regulationTypes: RegulationType[] = [
  'ISO',
  'PRL',
  'GDPR',
  'LOPD',
  'Ley',
  'Normativa',
  'Certificación',
  'Otro',
];

const typeColors: Record<RegulationType, string> = {
  ISO: 'bg-blue-500',
  PRL: 'bg-red-500',
  GDPR: 'bg-purple-500',
  LOPD: 'bg-green-500',
  Ley: 'bg-orange-500',
  Normativa: 'bg-yellow-500',
  Certificación: 'bg-indigo-500',
  Otro: 'bg-gray-500',
};

export default function CompliancePage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const itemsPerPage = 15;

  const regulations = useLiveQuery(() => db.getAllRegulations(), []);
  const expiringCompliance = useLiveQuery(() => db.getExpiringCompliance(30), []);

  const isManager =
    user && ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);

  const filteredRegulations = useMemo(() => {
    if (!regulations) return [];
    return regulations.filter(reg => {
      const typeMatch = typeFilter === 'all' || reg.type === typeFilter;
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'active' && reg.isActive) ||
        (statusFilter === 'inactive' && !reg.isActive);
      return typeMatch && statusMatch;
    });
  }, [regulations, typeFilter, statusFilter]);

  const totalPages = useMemo(
    () => Math.ceil(filteredRegulations.length / itemsPerPage),
    [filteredRegulations]
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRegulations = useMemo(
    () => filteredRegulations.slice(startIndex, endIndex),
    [filteredRegulations, startIndex, endIndex]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  if (regulations === undefined || expiringCompliance === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Compliance y Normativas
          </h1>
          <p className="text-muted-foreground">
            Gestiona las normativas y el cumplimiento regulatorio de la organización
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/compliance/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Normativa
          </Link>
        </Button>
      </div>

      {expiringCompliance.length > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Cumplimientos Próximos a Vencer
            </CardTitle>
            <CardDescription>
              {expiringCompliance.length} cumplimiento(s) vencerán en los próximos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/dashboard/compliance/expiring">Ver detalles</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="regulations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regulations">Normativas</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="audits">Auditorías</TabsTrigger>
        </TabsList>

        <TabsContent value="regulations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Normativas Registradas</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={typeFilter}
                    onValueChange={value => {
                      setTypeFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {regulationTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={value => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activas</SelectItem>
                      <SelectItem value="inactive">Inactivas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paginatedRegulations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay normativas registradas.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/dashboard/compliance/new">Crear primera normativa</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedRegulations.map(regulation => (
                      <Card key={regulation.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-xl">{regulation.name}</CardTitle>
                                <Badge className={typeColors[regulation.type]}>
                                  {regulation.type}
                                </Badge>
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
                                {regulation.description && (
                                  <p className="mt-2">{regulation.description}</p>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Roles aplicables:</span>
                              <p className="font-medium">{regulation.applicableRoles.length}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cursos asociados:</span>
                              <p className="font-medium">{regulation.courseIds.length}</p>
                            </div>
                            {regulation.requiresRenewal && (
                              <>
                                <div>
                                  <span className="text-muted-foreground">Validez:</span>
                                  <p className="font-medium">
                                    {regulation.validityPeriod
                                      ? `${regulation.validityPeriod} meses`
                                      : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Renovación:</span>
                                  <p className="font-medium">
                                    {regulation.renewalPeriod
                                      ? `Cada ${regulation.renewalPeriod} meses`
                                      : 'N/A'}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex justify-end pt-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/compliance/${regulation.id}`}>
                                Ver detalles
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredRegulations.length > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      totalItems={filteredRegulations.length}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceDashboardComponent />
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditorías de Cumplimiento</CardTitle>
              <CardDescription>Registro de auditorías realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Gestión de auditorías en desarrollo. Próximamente podrás crear y gestionar
                auditorías de cumplimiento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComplianceDashboardComponent() {
  const allRegulations = useLiveQuery(() => db.getActiveRegulations(), []);
  const allUsers = useLiveQuery(() => db.getAllUsers(), []);
  const expiringCompliance = useLiveQuery(() => db.getExpiringCompliance(30), []);

  const complianceStats = useMemo(() => {
    if (!allRegulations || !allUsers) return null;

    let totalApplicable = 0;
    let totalCompliant = 0;
    let totalExpiring = 0;
    let totalExpired = 0;

    for (const regulation of allRegulations) {
      const applicableUsers = allUsers.filter(
        u =>
          u.status === 'approved' &&
          regulation.applicableRoles.includes(u.role) &&
          (!regulation.applicableDepartments ||
            regulation.applicableDepartments.length === 0 ||
            regulation.applicableDepartments.includes(u.department))
      );
      totalApplicable += applicableUsers.length;
    }

    if (expiringCompliance) {
      const today = new Date();
      for (const comp of expiringCompliance) {
        if (!comp.expirationDate) continue;
        const expDate = new Date(comp.expirationDate);
        const daysUntilExpiry = Math.floor(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry < 0) totalExpired++;
        else if (daysUntilExpiry <= 30) totalExpiring++;
        totalCompliant++;
      }
    }

    return {
      totalApplicable,
      totalCompliant,
      totalExpiring,
      totalExpired,
      complianceRate: totalApplicable > 0 ? (totalCompliant / totalApplicable) * 100 : 0,
    };
  }, [allRegulations, allUsers, expiringCompliance]);

  if (!allRegulations || !allUsers || expiringCompliance === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!complianceStats) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aplicable</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceStats.totalApplicable}</div>
            <p className="text-xs text-muted-foreground">Usuarios sujetos a normativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceStats.totalCompliant}
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceStats.complianceRate.toFixed(1)}% de cumplimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos a Vencer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {complianceStats.totalExpiring}
            </div>
            <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complianceStats.totalExpired}</div>
            <p className="text-xs text-muted-foreground">Requieren renovación urgente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cumplimiento por Normativa</CardTitle>
          <CardDescription>Estado de cumplimiento de cada normativa activa</CardDescription>
        </CardHeader>
        <CardContent>
          {allRegulations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay normativas activas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Normativa</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Usuarios Aplicables</TableHead>
                  <TableHead>Cumplidos</TableHead>
                  <TableHead className="w-[200px]">Tasa de Cumplimiento</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRegulations.map(regulation => {
                  const applicableUsers = allUsers.filter(
                    u =>
                      u.status === 'approved' &&
                      regulation.applicableRoles.includes(u.role) &&
                      (!regulation.applicableDepartments ||
                        regulation.applicableDepartments.length === 0 ||
                        regulation.applicableDepartments.includes(u.department))
                  );

                  return (
                    <RegulationComplianceRow
                      key={regulation.id}
                      regulation={regulation}
                      applicableUsers={applicableUsers}
                    />
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RegulationComplianceRow({
  regulation,
  applicableUsers,
}: {
  regulation: Regulation;
  applicableUsers: any[];
}) {
  const compliance = useLiveQuery(
    () => db.getComplianceForRegulation(regulation.id),
    [regulation.id]
  );
  const compliantCount = compliance?.length || 0;
  const rate = applicableUsers.length > 0 ? (compliantCount / applicableUsers.length) * 100 : 0;

  return (
    <TableRow>
      <TableCell className="font-medium">{regulation.name}</TableCell>
      <TableCell>{regulation.code}</TableCell>
      <TableCell>{applicableUsers.length}</TableCell>
      <TableCell>{compliantCount}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress value={rate} className="h-2" />
          <span className="text-xs font-semibold w-12">{rate.toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/compliance/${regulation.id}`}>Ver detalles</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
