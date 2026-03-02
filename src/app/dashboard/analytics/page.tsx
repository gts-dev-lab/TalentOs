'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Loader2, FilePenLine, ShieldCheck, FileText } from 'lucide-react';
import { ChartConfig } from '@/components/ui/chart';
import * as db from '@/lib/db';
import { departments as allDepartmentsList, roles as allRolesList } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth';
import type { ComplianceReportData } from '@/lib/types';
import { TrainingOverviewTab } from '@/components/analytics/TrainingOverviewTab';
import { ComplianceTab } from '@/components/analytics/ComplianceTab';
import { CostsAnalysisTab } from '@/components/analytics/CostsAnalysisTab';
import { downloadCsv } from '@/lib/utils';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- Filter States ---
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [costInstructorFilter, setCostInstructorFilter] = useState('all');
  const [costModalityFilter, setCostModalityFilter] = useState('all');
  const [costCategoryFilters, setCostCategoryFilters] = useState<Record<string, boolean>>({});

  // --- Data Fetching ---
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);
  const allUsers = useLiveQuery(() => db.getAllUsers(), []);
  const allProgress = useLiveQuery(() => db.db.userProgress.toArray(), []);
  const allEnrollments = useLiveQuery(() => db.db.enrollments.toArray(), []);
  const costs = useLiveQuery(() => db.getAllCosts(), []);
  const complianceData = useLiveQuery(
    () => db.getComplianceReportData(departmentFilter, roleFilter),
    [departmentFilter, roleFilter]
  );
  const costCategories = useLiveQuery(() => db.getAllCostCategories(), []);

  // Sync cost category filters when categories are loaded from DB
  useEffect(() => {
    if (costCategories && costCategories.length > 0) {
      setCostCategoryFilters(
        costCategories.reduce(
          (acc, cat) => {
            acc[cat.name] = true; // Set all to true by default
            return acc;
          },
          {} as Record<string, boolean>
        )
      );
    }
  }, [costCategories]);

  // --- Memoized Filter Options ---
  const allInstructors = useMemo(
    () => ['all', ...new Set(allCourses?.map(c => c.instructor) || [])],
    [allCourses]
  );
  const allModalities = useMemo(
    () => ['all', ...new Set(allCourses?.map(c => c.modality) || [])],
    [allCourses]
  );
  const allCostCategories = useMemo(() => costCategories?.map(c => c.name) || [], [costCategories]);

  // --- Cost Data Calculations ---
  const filteredCoursesForCosts = useMemo(() => {
    if (!allCourses) return [];
    return allCourses.filter(course => {
      const instructorMatch =
        costInstructorFilter === 'all' || course.instructor === costInstructorFilter;
      const modalityMatch = costModalityFilter === 'all' || course.modality === costModalityFilter;
      return instructorMatch && modalityMatch;
    });
  }, [allCourses, costInstructorFilter, costModalityFilter]);

  const filteredCourseIdsForCosts = useMemo(
    () => new Set(filteredCoursesForCosts.map(c => c.id)),
    [filteredCoursesForCosts]
  );

  const filteredCosts = useMemo(() => {
    if (!costs) return [];
    return costs.filter(cost => {
      const categoryMatch = costCategoryFilters[cost.category];
      const courseMatch = !cost.courseId || filteredCourseIdsForCosts.has(cost.courseId);
      return categoryMatch && courseMatch;
    });
  }, [costs, costCategoryFilters, filteredCourseIdsForCosts]);

  const spendingByCategory = useMemo(() => {
    if (!filteredCosts) return {};
    return filteredCosts.reduce(
      (acc, cost) => {
        if (!acc[cost.category]) acc[cost.category] = 0;
        acc[cost.category] += cost.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [filteredCosts]);

  const barChartData = useMemo(
    () =>
      Object.keys(spendingByCategory).map(category => ({
        category,
        amount: spendingByCategory[category],
      })),
    [spendingByCategory]
  );

  const monthlySpending = useMemo(() => {
    if (!filteredCosts) return {};
    return filteredCosts.reduce(
      (acc, cost) => {
        const date = new Date(cost.date);
        const monthKey = format(date, 'yyyy-MM');
        if (!acc[monthKey])
          acc[monthKey] = { amount: 0, month: format(date, 'MMM', { locale: es }) };
        acc[monthKey].amount += cost.amount;
        return acc;
      },
      {} as Record<string, { amount: number; month: string }>
    );
  }, [filteredCosts]);

  const lineChartData = useMemo(
    () =>
      Object.keys(monthlySpending)
        .sort()
        .map(key => ({
          month: monthlySpending[key].month,
          amount: monthlySpending[key].amount,
        })),
    [monthlySpending]
  );

  const costByCourse = useMemo(() => {
    if (!allCourses || !filteredCosts) return [];

    const courseMap = new Map(allCourses.map(c => [c.id, c.title]));

    const costsGroupedByCourse = filteredCosts.reduce(
      (acc, cost) => {
        if (cost.courseId && filteredCourseIdsForCosts.has(cost.courseId)) {
          if (!acc[cost.courseId]) acc[cost.courseId] = 0;
          acc[cost.courseId] += cost.amount;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(costsGroupedByCourse)
      .map(([courseId, totalCost]) => ({
        courseId,
        courseTitle: courseMap.get(courseId) || 'Curso Desconocido',
        totalCost,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [allCourses, filteredCosts, filteredCourseIdsForCosts]);

  // --- Training Data Calculations ---
  const trainingData = useMemo(() => {
    if (!allCourses || !allUsers || !allProgress || !allEnrollments) {
      return null;
    }

    // Apply filters for training data
    const filteredUsers = allUsers.filter(
      u =>
        (departmentFilter === 'all' || u.department === departmentFilter) &&
        (roleFilter === 'all' || u.role === roleFilter)
    );
    const filteredUserIds = new Set(filteredUsers.map(u => u.id));
    const filteredProgress = allProgress.filter(p => filteredUserIds.has(p.userId));
    const filteredEnrollments = allEnrollments.filter(e => filteredUserIds.has(e.studentId));

    const courseModuleCounts = new Map(allCourses.map(c => [c.id, c.modules?.length || 0]));

    // --- Stat Cards Data ---
    const individualProgressPercentages = filteredProgress.map(p => {
      const totalModules = courseModuleCounts.get(p.courseId) || 0;
      return totalModules > 0 ? (p.completedModules.length / totalModules) * 100 : 0;
    });
    const averageCompletionRate =
      individualProgressPercentages.length > 0
        ? individualProgressPercentages.reduce((a, b) => a + b, 0) /
          individualProgressPercentages.length
        : 0;

    const totalTrainingHours = allCourses.reduce((acc, course) => {
      const hours = parseInt(course.duration) || 0;
      return acc + hours;
    }, 0);

    const activeUsers = filteredUsers.length;

    // --- Department Progress ---
    const progressByDepartment: Record<string, { totalProgress: number; count: number }> = {};
    const visibleDepartments = [...new Set(filteredUsers.map(u => u.department))];
    visibleDepartments.forEach(dept => {
      progressByDepartment[dept] = { totalProgress: 0, count: 0 };
    });

    for (const progress of filteredProgress) {
      const user = filteredUsers.find(u => u.id === progress.userId);
      if (user) {
        const totalModules = courseModuleCounts.get(progress.courseId) || 0;
        if (totalModules > 0) {
          const percentage = (progress.completedModules.length / totalModules) * 100;
          if (progressByDepartment[user.department]) {
            progressByDepartment[user.department].totalProgress += percentage;
            progressByDepartment[user.department].count += 1;
          }
        }
      }
    }
    const departmentProgress = Object.entries(progressByDepartment)
      .map(([department, data]) => ({
        department,
        progress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
      }))
      .sort((a, b) => b.progress - a.progress);

    // --- Role Progress ---
    const progressByRole: Record<string, { totalProgress: number; count: number }> = {};
    const visibleRoles = [...new Set(filteredUsers.map(u => u.role))];
    visibleRoles.forEach(role => {
      progressByRole[role] = { totalProgress: 0, count: 0 };
    });

    for (const progress of filteredProgress) {
      const user = filteredUsers.find(u => u.id === progress.userId);
      if (user) {
        const totalModules = courseModuleCounts.get(progress.courseId) || 0;
        if (totalModules > 0) {
          const percentage = (progress.completedModules.length / totalModules) * 100;
          if (progressByRole[user.role]) {
            progressByRole[user.role].totalProgress += percentage;
            progressByRole[user.role].count += 1;
          }
        }
      }
    }
    const roleProgress = Object.entries(progressByRole)
      .filter(([role, data]) => role !== 'Personal Externo')
      .map(([role, data]) => ({
        role: role.replace(' ', '\n'),
        progress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
      }))
      .sort((a, b) => b.progress - a.progress);

    // --- Monthly Activity ---
    const monthlyActivity: Record<
      string,
      { month: string; iniciados: number; completados: number }
    > = {};

    filteredEnrollments
      .filter(e => e.status === 'approved')
      .forEach(enrollment => {
        const date = enrollment.updatedAt ? parseISO(enrollment.updatedAt) : new Date();
        const monthKey = format(date, 'yyyy-MM');
        if (!monthlyActivity[monthKey]) {
          monthlyActivity[monthKey] = {
            month: format(date, 'MMM', { locale: es }),
            iniciados: 0,
            completados: 0,
          };
        }
        monthlyActivity[monthKey].iniciados += 1;
      });

    filteredProgress.forEach(progress => {
      const totalModules = courseModuleCounts.get(progress.courseId) || 0;
      if (totalModules > 0 && progress.completedModules.length === totalModules) {
        const date = progress.updatedAt ? parseISO(progress.updatedAt) : new Date();
        const monthKey = format(date, 'yyyy-MM');
        if (!monthlyActivity[monthKey]) {
          monthlyActivity[monthKey] = {
            month: format(date, 'MMM', { locale: es }),
            iniciados: 0,
            completados: 0,
          };
        }
        monthlyActivity[monthKey].completados += 1;
      }
    });

    const activityChartData = Object.keys(monthlyActivity)
      .sort()
      .map(key => monthlyActivity[key]);

    return {
      averageCompletionRate,
      totalTrainingHours,
      activeUsers,
      departmentProgress,
      roleProgress,
      activityChartData,
    };
  }, [allCourses, allUsers, allProgress, allEnrollments, departmentFilter, roleFilter]);

  const handleExport = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);
    try {
      const originalBg = reportRef.current.style.backgroundColor;
      reportRef.current.style.backgroundColor = 'white';

      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      reportRef.current.style.backgroundColor = originalBg;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
        hotfixes: ['px_scaling'],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Informe_Analiticas.pdf');
    } catch (error) {
      db.logSystemEvent('ERROR', 'Error generating PDF', { error: (error as Error).message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportComplianceCsv = () => {
    if (complianceData) {
      const dataToExport = complianceData.map(d => ({
        ...d,
        complianceRate: d.complianceRate.toFixed(2),
      }));
      downloadCsv(dataToExport, 'informe_cumplimiento.csv');
    }
  };

  const handleExportCostsCsv = () => {
    if (filteredCosts) {
      const dataToExport = filteredCosts.map(({ id, ...rest }) => rest); // remove id
      downloadCsv(dataToExport, 'informe_costes_filtrados.csv');
    }
  };

  const handleExportDepartmentProgressCsv = () => {
    if (trainingData?.departmentProgress) {
      downloadCsv(trainingData.departmentProgress, 'progreso_por_departamento.csv');
    }
  };

  const handleExportRoleProgressCsv = () => {
    if (trainingData?.roleProgress) {
      const dataToExport = trainingData.roleProgress.map(r => ({
        ...r,
        role: r.role.replace('\n', ' '),
      }));
      downloadCsv(dataToExport, 'progreso_por_rol.csv');
    }
  };

  if (
    !user ||
    !['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role)
  ) {
    router.push('/dashboard');
    return null;
  }

  if (!trainingData || complianceData === undefined || costs === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const barChartConfig = {
    amount: { label: 'Importe (€)', color: 'hsl(var(--chart-1))' },
  } satisfies ChartConfig;
  const lineChartConfig = {
    amount: { label: 'Importe (€)', color: 'hsl(var(--chart-2))' },
  } satisfies ChartConfig;
  const departmentChartConfig = {
    progress: { label: 'Progreso (%)', color: 'hsl(var(--chart-1))' },
  } satisfies ChartConfig;
  const roleChartConfig = {
    progress: { label: 'Progreso (%)', color: 'hsl(var(--chart-2))' },
  } satisfies ChartConfig;
  const activityChartConfig = {
    iniciados: { label: 'Iniciados', color: 'hsl(var(--chart-1))' },
    completados: { label: 'Completados', color: 'hsl(var(--chart-3))' },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8" ref={reportRef}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análisis y Reportes</h1>
          <p className="text-muted-foreground">
            Visualiza métricas clave de formación, costes y rendimiento.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FilePenLine className="mr-2 h-4 w-4" />
              )}
              Informe General (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportComplianceCsv}>
              <FileText className="mr-2 h-4 w-4" />
              Cumplimiento (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCostsCsv}>
              <FileText className="mr-2 h-4 w-4" />
              Costes Filtrados (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportDepartmentProgressCsv}>
              <FileText className="mr-2 h-4 w-4" />
              Progreso por Dpto. (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportRoleProgressCsv}>
              <FileText className="mr-2 h-4 w-4" />
              Progreso por Rol (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 max-w-lg">
          <TabsTrigger value="training">Resumen de Formación</TabsTrigger>
          <TabsTrigger value="compliance">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Cumplimiento
          </TabsTrigger>
          <TabsTrigger value="costs">Análisis de Costes</TabsTrigger>
        </TabsList>

        <TabsContent value="training">
          <TrainingOverviewTab
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            allDepartmentsList={allDepartmentsList}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            allRolesList={allRolesList}
            trainingData={trainingData}
            departmentChartConfig={departmentChartConfig}
            roleChartConfig={roleChartConfig}
            activityChartConfig={activityChartConfig}
          />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceTab
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            allDepartmentsList={allDepartmentsList}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            allRolesList={allRolesList}
            complianceData={complianceData}
          />
        </TabsContent>

        <TabsContent value="costs">
          <CostsAnalysisTab
            costInstructorFilter={costInstructorFilter}
            setCostInstructorFilter={setCostInstructorFilter}
            allInstructors={allInstructors}
            costModalityFilter={costModalityFilter}
            setCostModalityFilter={setCostModalityFilter}
            allModalities={allModalities}
            filteredCosts={filteredCosts}
            barChartConfig={barChartConfig}
            barChartData={barChartData}
            lineChartConfig={lineChartConfig}
            lineChartData={lineChartData}
            costByCourse={costByCourse}
            allCostCategories={allCostCategories}
            costCategoryFilters={costCategoryFilters}
            setCostCategoryFilters={setCostCategoryFilters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
