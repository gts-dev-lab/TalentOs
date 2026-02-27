// @ts-nocheck

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar as BigCalendar, Views, type View } from 'react-big-calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, PlusCircle, Trash2, X, Video } from 'lucide-react';
import { localizer } from '@/lib/calendar-localizer';
import * as db from '@/lib/db';
import type { CalendarEvent, Course, CalendarEventType } from '@/lib/types';
import { calendarEventTypes } from '@/lib/types';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSidebar } from '@/components/ui/sidebar';

const eventSchema = z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
    description: z.string().optional(),
    courseId: z.string({ required_error: 'Debes seleccionar un curso.' }),
    type: z.enum(calendarEventTypes as [string, ...string[]], { required_error: 'Debes seleccionar un tipo.' }),
    allDay: z.boolean(),
    start: z.string(),
    end: z.string(),
    videoCallLink: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
}).refine(data => {
    // If not an all-day event, end must be after start
    if (!data.allDay && data.start && data.end) {
        return isAfter(parseISO(data.end), parseISO(data.start));
    }
    return true;
}, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
    path: ['end'],
});


type EventFormValues = z.infer<typeof eventSchema>;

const eventColors: Record<CalendarEventType, string> = {
    clase: 'bg-blue-500 border-blue-500',
    examen: 'bg-red-500 border-red-500',
    entrega: 'bg-amber-500 border-amber-500',
    taller: 'bg-green-500 border-green-500',
    otro: 'bg-gray-500 border-gray-500',
};

function EventDialog({
  isOpen,
  onOpenChange,
  event,
  courses,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Partial<CalendarEvent> | null;
  courses: Course[];
  onSave: (data: CalendarEvent, isNew: boolean) => Promise<boolean>;
  onDelete: (id: number) => void;
}) {
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    
    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            description: '',
            courseId: undefined,
            type: undefined,
            allDay: false,
            start: '',
            end: '',
            videoCallLink: '',
        }
    });

    useEffect(() => {
        if (event) {
            form.reset({
                title: event.title || '',
                description: event.description || '',
                courseId: event.courseId,
                type: event.type,
                allDay: !!event.allDay,
                start: event.start ? format(parseISO(event.start), "yyyy-MM-dd'T'HH:mm") : '',
                end: event.end ? format(parseISO(event.end), "yyyy-MM-dd'T'HH:mm") : '',
                videoCallLink: event.videoCallLink || '',
            });
        }
    }, [event, form]);

    const onSubmit = async (data: EventFormValues) => {
        if (!user) return;
        
        const isNew = !('id' in (event || {}));
        
        const eventData: CalendarEvent = {
            ...(event as CalendarEvent), // Keeps original ID for updates
            title: data.title,
            description: data.description,
            videoCallLink: data.videoCallLink,
            courseId: data.courseId,
            type: data.type as CalendarEventType,
            allDay: data.allDay,
            start: parseISO(data.start).toISOString(),
            end: parseISO(data.end).toISOString(),
            isCompleted: (event as CalendarEvent)?.isCompleted || false,
            createdBy: isNew ? user.id : (event as CalendarEvent).createdBy,
            modifiedBy: user.id,
        };
        
        const success = await onSave(eventData, isNew);
        if (success) {
            onOpenChange(false);
            form.reset();
        }
    };
    
    const handleDelete = useCallback(() => {
        if (event && 'id' in event && event.id) {
            setIsDeleting(true);
            onDelete(event.id);
            onOpenChange(false);
        }
    }, [event, onDelete, onOpenChange]);

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{event && 'id' in event ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="videoCallLink" render={({ field }) => (<FormItem><FormLabel>Enlace de Videollamada (Zoom, Meet, etc.)</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="courseId" render={({ field }) => (<FormItem><FormLabel>Curso</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl><SelectContent>{calendarEventTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="start" render={({ field }) => (<FormItem><FormLabel>Inicio</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="end" render={({ field }) => (<FormItem><FormLabel>Fin</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="allDay" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Todo el día</FormLabel></div></FormItem>)} />
            </form>
          </Form>
          <DialogFooter className="justify-between sm:justify-between">
            <div>
              {event && 'id' in event && event.id && (
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={isDeleting}>Eliminar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer. El evento se eliminará permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                           <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" form="event-form" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useSidebar();
  const allEvents = useLiveQuery(() => db.getAllCalendarEvents(), []);
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);

  const [view, setView] = useState<View>(isMobile ? Views.AGENDA : Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);

  useEffect(() => {
    // Adjust view based on screen size changes
    setView(isMobile ? Views.AGENDA : Views.MONTH);
  }, [isMobile]);

  const { formats } = useMemo(() => ({
      formats: {
          timeGutterFormat: 'HH:mm',
          eventTimeRangeFormat: ({ start, end }: {start: Date, end: Date}) =>
            `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
          dayFormat: (date: Date, culture: any, localizer: any) => localizer.format(date, 'EEEE d', culture),
          dayHeaderFormat: (date: Date, culture: any, localizer: any) => localizer.format(date, 'EEEE d MMM', culture),
      },
  }), []);
  
  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => {
      setSelectedEvent({ start: start.toISOString(), end: end.toISOString(), allDay: false });
      setIsDialogOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
      setSelectedEvent(event);
      setIsDialogOpen(true);
  }, []);

  const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
      const { id } = event;
      if (typeof id === 'number') {
        try {
            await db.updateCalendarEvent(id, { start: start.toISOString(), end: end.toISOString() });
            toast({ title: 'Evento reprogramado', description: 'La fecha del evento ha sido actualizada.' });
        } catch (error) {
            console.error("Error updating event:", error);
            toast({ title: "Error", description: "No se pudo reprogramar el evento.", variant: "destructive" });
        }
      }
  }, [toast]);
  
  const handleSaveEvent = useCallback(async (data: CalendarEvent, isNew: boolean): Promise<boolean> => {
      const hasConflict = (allEvents || []).some(existingEvent => {
          if (!isNew && existingEvent.id === data.id) return false;
          const existingStart = parseISO(existingEvent.start);
          const existingEnd = parseISO(existingEvent.end);
          const newStart = parseISO(data.start);
          const newEnd = parseISO(data.end);
          return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasConflict) {
          toast({
              title: "Conflicto de Horario Detectado",
              description: "Este evento se solapa con otro ya existente. Por favor, elige otra franja horaria.",
              variant: "destructive",
          });
          return false;
      }
      
      try {
          if (isNew) {
              await db.addCalendarEvent(data);
              toast({ title: 'Evento Creado', description: 'El nuevo evento ha sido añadido al calendario.' });
          } else if (data.id) {
              await db.updateCalendarEvent(data.id, data);
              toast({ title: 'Evento Actualizado', description: 'Los cambios en el evento han sido guardados.' });
          }

          const originalEvent = selectedEvent;
          if (data.videoCallLink && (!originalEvent?.videoCallLink || originalEvent.videoCallLink !== data.videoCallLink)) {
              const course = await db.getCourseById(data.courseId);
              const enrollments = await db.db.enrollments.where({ courseId: data.courseId, status: 'approved' }).toArray();
              const studentIds = enrollments.map(e => e.studentId);

              for (const studentId of studentIds) {
                  await db.addNotification({
                      userId: studentId,
                      message: `Enlace de videollamada para "${data.title}" del curso "${course?.title || ''}" disponible.`,
                      type: 'course_announcement',
                      relatedUrl: `/dashboard/courses/${data.courseId}`,
                      isRead: false,
                      timestamp: new Date().toISOString(),
                  });
              }
              if (studentIds.length > 0) {
                   toast({ title: 'Alumnos Notificados', description: `Se ha notificado a ${studentIds.length} alumnos sobre el enlace.` });
              }
          }

          return true;
      } catch (error) {
          console.error("Error saving event:", error);
          toast({ title: "Error", description: "No se pudo guardar el evento.", variant: "destructive" });
          return false;
      }
  }, [allEvents, toast, selectedEvent]);
  
  const handleDeleteEvent = useCallback(async (id: number) => {
      try {
          await db.deleteCalendarEvent(id);
          toast({ title: 'Evento Eliminado' });
      } catch (error) {
          console.error("Error deleting event:", error);
          toast({ title: 'Error', description: 'No se pudo eliminar el evento.', variant: 'destructive' });
      }
  }, [toast]);
  
  const calendarEvents = useMemo(() => {
    return (allEvents || []).map(event => ({
        ...event,
        start: parseISO(event.start),
        end: parseISO(event.end),
    }));
  }, [allEvents]);

  if (!user || !allCourses) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendario de Formación</h1>
        <Button onClick={() => handleSelectSlot({ start: new Date(), end: new Date(Date.now() + 60*60*1000) })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Evento
        </Button>
      </div>

      <Card className="flex-grow shadow-lg">
        <CardContent className="p-2 md:p-4 h-full">
          <BigCalendar
            localizer={localizer}
            events={calendarEvents as any}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            views={isMobile ? { agenda: true, day: true } : { month: true, week: true, day: true, agenda: true }}
            onView={isMobile ? (v) => { if (v !== 'month' && v !== 'week') setView(v); } : setView}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            selectable
            resizable={!isMobile}
            formats={formats}
            messages={{
                next: "Sig >",
                previous: "< Ant",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                showMore: total => `+${total} más`,
            }}
            eventPropGetter={(event) => ({
                className: cn('text-white p-1 text-xs rounded-md border-2', eventColors[event.type]),
            })}
            className="h-full"
          />
        </CardContent>
      </Card>
      
      <EventDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={selectedEvent}
        courses={allCourses}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
