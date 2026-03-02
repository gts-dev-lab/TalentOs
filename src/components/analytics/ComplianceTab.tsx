'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComplianceReportTable } from './ComplianceReportTable';
import type { ComplianceReportData } from '@/lib/types';

interface ComplianceTabProps {
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  allDepartmentsList: string[];
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  allRolesList: string[];
  complianceData: ComplianceReportData[];
}

export function ComplianceTab({
  departmentFilter,
  setDepartmentFilter,
  allDepartmentsList,
  roleFilter,
  setRoleFilter,
  allRolesList,
  complianceData,
}: ComplianceTabProps) {
  return (
    <div className="mt-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Cumplimiento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Departamentos</SelectItem>
              {allDepartmentsList.map(d => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Roles</SelectItem>
              {allRolesList.map(r => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <ComplianceReportTable data={complianceData} />
    </div>
  );
}
