'use client';

import type { ComplianceReportData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export function ComplianceReportTable({ data }: { data: ComplianceReportData[] }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Informe de Cumplimiento de Formación Obligatoria</CardTitle>
        <CardDescription>
          Estado de la formación obligatoria para cada usuario según su rol.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Cursos Obligatorios</TableHead>
              <TableHead>Cursos Completados</TableHead>
              <TableHead className="w-[200px]">Tasa de Cumplimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(item => (
              <TableRow key={item.userId}>
                <TableCell className="font-medium">{item.userName}</TableCell>
                <TableCell>{item.userRole}</TableCell>
                <TableCell className="text-center">{item.mandatoryCoursesCount}</TableCell>
                <TableCell className="text-center">{item.completedCoursesCount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={item.complianceRate} className="h-2" />
                    <span className="text-xs font-semibold">{item.complianceRate.toFixed(0)}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
