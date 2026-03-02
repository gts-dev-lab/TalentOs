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
import { ListFilter } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip as ChartTooltipProvider,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CircleDollarSign, CreditCard, CalendarClock, Scale } from 'lucide-react';

interface CostsAnalysisTabProps {
  costInstructorFilter: string;
  setCostInstructorFilter: (value: string) => void;
  allInstructors: string[];
  costModalityFilter: string;
  setCostModalityFilter: (value: string) => void;
  allModalities: string[];
  filteredCosts: any[];
  barChartConfig: ChartConfig;
  barChartData: any[];
  lineChartConfig: ChartConfig;
  lineChartData: any[];
  costByCourse: any[];
  allCostCategories: string[];
  costCategoryFilters: Record<string, boolean>;
  setCostCategoryFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const CostsAnalysisTab = ({
  costInstructorFilter,
  setCostInstructorFilter,
  allInstructors,
  costModalityFilter,
  setCostModalityFilter,
  allModalities,
  filteredCosts,
  barChartConfig,
  barChartData,
  lineChartConfig,
  lineChartData,
  costByCourse,
  allCostCategories,
  costCategoryFilters,
  setCostCategoryFilters,
}: CostsAnalysisTabProps) => {
  return (
    <div className="mt-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Costes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Select value={costInstructorFilter} onValueChange={setCostInstructorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Instructores</SelectItem>
              {allInstructors
                .filter(i => i !== 'all')
                .map(i => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={costModalityFilter} onValueChange={setCostModalityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Modalidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Modalidades</SelectItem>
              {allModalities
                .filter(m => m !== 'all')
                .map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Presupuesto Anual" value="25,000€" icon={CircleDollarSign} />
        <StatCard
          title="Gasto Total Filtrado"
          value={`${filteredCosts.reduce((a, b) => a + b.amount, 0).toFixed(2)}€`}
          icon={CreditCard}
        />
        <StatCard
          title="Gasto (Últ. 30 días)"
          value="1,550€"
          icon={CalendarClock}
          description="No afectado por filtros"
        />
        <StatCard
          title="Presupuesto Restante"
          value="16,050€"
          icon={Scale}
          description="No afectado por filtros"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gasto por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={barChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis unit="€" />
                  <ChartTooltipProvider content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Gasto Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineChartConfig} className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={lineChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis unit="€" />
                  <ChartTooltipProvider
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Line
                    dataKey="amount"
                    type="monotone"
                    stroke="var(--color-amount)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-amount)' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Desglose de Costes por Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead className="text-right">Coste Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costByCourse.map(item => (
                <TableRow key={item.courseId}>
                  <TableCell className="font-medium">{item.courseTitle}</TableCell>
                  <TableCell className="text-right">{item.totalCost.toFixed(2)}€</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>
              Listado de los gastos registrados que coinciden con los filtros.
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span>Categoría</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allCostCategories.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={costCategoryFilters[category] ?? true}
                    onCheckedChange={checked =>
                      setCostCategoryFilters(prev => ({ ...prev, [category]: !!checked }))
                    }
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCosts.map(cost => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">{cost.item}</TableCell>
                  <TableCell>{cost.category}</TableCell>
                  <TableCell className="text-right">{cost.amount.toFixed(2)}€</TableCell>
                  <TableCell>{new Date(cost.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
