
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ListFilter, Search } from 'lucide-react';
import * as db from '@/lib/db';
import { enrollmentStatuses, type EnrollmentWithDetails, type EnrollmentStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from './status-badge';
import { Pagination } from '@/components/ui/pagination';

const statusUpdateSchema = z.object({
  status: z.enum(enrollmentStatuses),
  justification: z.string().optional(),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

const statusOptions: { value: EnrollmentStatus, label: string }[] = [
    { value: 'approved', label: 'Aprobar' },
    { value: 'rejected', label: 'Rechazar' },
    { value: 'waitlisted', label: 'Poner en lista de espera' },
    { value: 'needs_review', label: 'Marcar para revisión' },
];

function UpdateStatusDialog({
  enrollment,
  open,
  onOpenChange,
}: {
  enrollment: EnrollmentWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
    const { toast } = useToast();
    const form = useForm<StatusUpdateFormValues>({
        resolver: zodResolver(statusUpdateSchema),
        defaultValues: {
            justification: '',
            status: undefined
        }
    });

    useEffect(() => {
        if (open && enrollment) {
            form.reset({
                status: enrollment.status,
                justification: enrollment.justification || ''
            });
        }
    }, [open, enrollment, form]);

    const onSubmit = async (data: StatusUpdateFormValues) => {
        if (!enrollment?.id) return;
        try {
            await db.updateEnrollmentStatus(enrollment.id, data.status, data.justification);
            toast({ title: "Estado actualizado", description: `La inscripción de ${enrollment.userName} ahora está como '${data.status}'.` });
            onOpenChange(false);
            form.reset();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
        }
    };
    
    if (!enrollment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Inscripción</DialogTitle>
                    <DialogDescription>
                        Gestionando la solicitud de <strong>{enrollment.userName}</strong> para el curso <strong>{enrollment.courseTitle}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form id="update-status-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                     <Controller
                        name="status"
                        control={form.control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label>Nuevo Estado</label>
                                <div className="grid grid-cols-2 gap-2">
                                {statusOptions.map(opt => (
                                    <Button
                                        key={opt.value}
                                        type="button"
                                        variant={field.value === opt.value ? 'default' : 'outline'}
                                        onClick={() => field.onChange(opt.value)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                                </div>
                            </div>
                        )}
                    />
                    <Controller
                        name="justification"
                        control={form.control}
                        render={({ field }) => (
                           <div>
                                <label>Justificación (Opcional)</label>
                               <Textarea placeholder="Ej: Aprobado por cumplir los requisitos del puesto..." {...field} />
                           </div>
                        )}
                    />
                </form>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="update-status-form" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Actualizar Estado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function AdminEnrollmentsView() {
    const [searchTerm, setSearchTerm] = useState('');
    const allEnrollments = useLiveQuery(db.getAllEnrollmentsWithDetails, [], []);
    
    const [filters, setFilters] = useState<Record<EnrollmentStatus, boolean>>(() =>
        Object.fromEntries(enrollmentStatuses.map(s => [s, s === 'pending'])) as any
    );

    const [enrollmentToUpdate, setEnrollmentToUpdate] = useState<EnrollmentWithDetails | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const filteredEnrollments = useMemo(() => {
        if (!allEnrollments) return [];
        return allEnrollments.filter(e => 
            filters[e.status] &&
            (searchTerm === '' ||
             e.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             e.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allEnrollments, filters, searchTerm]);
    
    const totalPages = useMemo(() => Math.ceil(filteredEnrollments.length / itemsPerPage), [filteredEnrollments.length]);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEnrollments = useMemo(() => filteredEnrollments.slice(startIndex, endIndex), [filteredEnrollments, startIndex, endIndex]);
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // Reset to page 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, searchTerm]);
    
    if (!allEnrollments) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gestión de Inscripciones</h1>
                <p className="text-muted-foreground">Supervisa, aprueba y gestiona todas las solicitudes de inscripción de la plataforma.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por usuario o curso..."
                                className="pl-8 w-full md:w-1/3"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline"><ListFilter className="mr-2 h-4 w-4" />Filtrar por Estado</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Mostrar Estados</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {enrollmentStatuses.map(status => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={filters[status]}
                                        onCheckedChange={checked => setFilters(f => ({ ...f, [status]: !!checked }))}
                                        className="capitalize"
                                    >
                                        {status.replace(/_/g, ' ')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Curso</TableHead>
                                    <TableHead>Fecha Solicitud</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEnrollments.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>
                                            <div className="font-medium">{e.userName}</div>
                                            <div className="text-sm text-muted-foreground">{e.userEmail}</div>
                                        </TableCell>
                                        <TableCell>{e.courseTitle}</TableCell>
                                        <TableCell>{format(new Date(e.requestDate), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell><StatusBadge status={e.status} /></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setEnrollmentToUpdate(e)}>
                                                Gestionar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredEnrollments.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">No se encontraron inscripciones con los filtros actuales.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {filteredEnrollments.length > 0 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredEnrollments.length}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <UpdateStatusDialog 
                enrollment={enrollmentToUpdate}
                open={!!enrollmentToUpdate}
                onOpenChange={() => setEnrollmentToUpdate(null)}
            />
        </div>
    );
}
