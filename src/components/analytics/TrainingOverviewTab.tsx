'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip as ChartTooltipProvider,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckSquare, Users, Clock } from 'lucide-react';

interface TrainingOverviewTabProps {
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  allDepartmentsList: string[];
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  allRolesList: string[];
  trainingData: {
    averageCompletionRate: number;
    totalTrainingHours: number;
    activeUsers: number;
    departmentProgress: any[];
    roleProgress: any[];
    activityChartData: any[];
  };
  departmentChartConfig: ChartConfig;
  roleChartConfig: ChartConfig;
  activityChartConfig: ChartConfig;
}

export function TrainingOverviewTab({
  departmentFilter,
  setDepartmentFilter,
  allDepartmentsList,
  roleFilter,
  setRoleFilter,
  allRolesList,
  trainingData,
  departmentChartConfig,
  roleChartConfig,
  activityChartConfig,
}: TrainingOverviewTabProps) {
  return (
    <div className="mt-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tasa de Finalización Media"
          value={`${trainingData.averageCompletionRate.toFixed(0)}%`}
          icon={CheckSquare}
          description="Para la selección actual"
        />
        <StatCard
          title="Horas de Formación Totales"
          value={`${trainingData.totalTrainingHours}`}
          icon={Clock}
          description="Programadas en el catálogo"
        />
        <StatCard
          title="Usuarios Activos"
          value={trainingData.activeUsers.toString()}
          icon={Users}
          description="Que coinciden con el filtro"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Progreso por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={departmentChartConfig} className="h-96 w-full">
              <ResponsiveContainer>
                <BarChart
                  data={trainingData.departmentProgress}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="department"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={150}
                  />
                  <XAxis type="number" dataKey="progress" domain={[0, 100]} unit="%" />
                  <ChartTooltipProvider
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Progreso por Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={roleChartConfig} className="h-96 w-full">
              <ResponsiveContainer>
                <BarChart
                  data={trainingData.roleProgress}
                  margin={{ left: 0, right: 20, bottom: 60 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="role"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis type="number" domain={[0, 100]} unit="%" />
                  <ChartTooltipProvider
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Actividad Formativa Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityChartConfig} className="h-80 w-full">
            <ResponsiveContainer>
              <LineChart
                data={trainingData.activityChartData}
                margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <ChartTooltipProvider content={<ChartTooltipContent />} />
                <Line
                  name="Iniciados"
                  dataKey="iniciados"
                  type="monotone"
                  stroke="var(--color-iniciados)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-iniciados)' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  name="Completados"
                  dataKey="completados"
                  type="monotone"
                  stroke="var(--color-completados)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-completados)' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
