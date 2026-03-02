'use client';

import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import { Banknote, Loader2, Euro } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';

/* Datos de ejemplo para la vista Nómina (solo UI). */
const MOCK_PAYROLL = [
  {
    id: '1',
    employee: 'Elena Vargas',
    department: 'Administración',
    base: 3200,
    bonus: 200,
    deductions: 640,
    net: 2760,
    status: 'Pagada',
  },
  {
    id: '2',
    employee: 'Carlos Ruiz',
    department: 'Técnicos de Emergencias',
    base: 2400,
    bonus: 150,
    deductions: 510,
    net: 2040,
    status: 'Pagada',
  },
  {
    id: '3',
    employee: 'Ana Gómez',
    department: 'Teleoperadores',
    base: 2200,
    bonus: 100,
    deductions: 460,
    net: 1840,
    status: 'Pagada',
  },
  {
    id: '4',
    employee: 'Dr. Alejandro Torres',
    department: 'Formación',
    base: 3800,
    bonus: 0,
    deductions: 760,
    net: 3040,
    status: 'Pendiente',
  },
  {
    id: '5',
    employee: 'Lucía Fernández',
    department: 'Formación',
    base: 3500,
    bonus: 300,
    deductions: 760,
    net: 3040,
    status: 'Pagada',
  },
  {
    id: '6',
    employee: 'Marcos Solís',
    department: 'Administración',
    base: 2900,
    bonus: 100,
    deductions: 600,
    net: 2400,
    status: 'Pagada',
  },
];

export default function NominaPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const managerRoles = ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'];
  if (!managerRoles.includes(user.role)) {
    router.push('/dashboard');
    return null;
  }

  const totalNet = MOCK_PAYROLL.reduce((s, r) => s + r.net, 0);
  const totalBase = MOCK_PAYROLL.reduce((s, r) => s + r.base, 0);
  const paidCount = MOCK_PAYROLL.filter(r => r.status === 'Pagada').length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold md:text-2xl">Nómina</h1>
        <p className="text-sm text-muted-foreground">
          Resumen y detalle de nóminas (ejemplo de UI estilo Frappe HRMS).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bruto"
          value={totalBase.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          icon={Euro}
        />
        <StatCard
          title="Total Neto"
          value={totalNet.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          icon={Banknote}
        />
        <StatCard title="Nóminas pagadas" value={String(paidCount)} icon={Banknote} />
        <StatCard
          title="Pendientes"
          value={String(MOCK_PAYROLL.length - paidCount)}
          icon={Banknote}
          description="Este mes"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de nóminas</CardTitle>
          <CardDescription>
            Ejemplo de tabla con datos de nómina (solo presentación).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Retenciones</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PAYROLL.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.employee}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell className="text-right">
                    {row.base.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.bonus.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.deductions.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.net.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        row.status === 'Pagada'
                          ? 'rounded-frappe-sm bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400'
                          : 'rounded-frappe-sm bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400'
                      }
                    >
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
