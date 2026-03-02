// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Users,
  Target,
  ShieldCheck,
  Award,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import { useAuth } from '@/contexts/auth';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type SearchResult = {
  id: string;
  type: 'course' | 'user' | 'pdi' | 'compliance' | 'certificate' | 'event' | 'resource';
  title: string;
  description?: string;
  url: string;
  icon: typeof BookOpen;
  metadata?: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar datos
  const courses = useLiveQuery(() => db.getAllCourses(), []);
  const users = useLiveQuery(() => db.getAllUsers(), []);
  const pdis = useLiveQuery(() => {
    if (!user) return Promise.resolve([]);
    if (['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role)) {
      return db.getAllPDIs();
    }
    return db.getPDIsForUser(user.id);
  }, [user?.id]);
  const regulations = useLiveQuery(() => db.getAllRegulations(), []);
  const certificates = useLiveQuery(() => db.getAllCertificates(), []);
  const events = useLiveQuery(() => db.getAllCalendarEvents(), []);

  const isManager =
    user && ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);

  // Shortcut Ctrl+K o Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filtrar resultados según búsqueda
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Buscar en cursos
    courses?.forEach(course => {
      if (
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query)
      ) {
        results.push({
          id: course.id,
          type: 'course',
          title: course.title,
          description: course.description.substring(0, 100),
          url: `/dashboard/courses/${course.id}`,
          icon: BookOpen,
          metadata: course.modality,
        });
      }
    });

    // Buscar en usuarios (solo managers)
    if (isManager) {
      users?.forEach(u => {
        if (
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.role.toLowerCase().includes(query) ||
          u.department?.toLowerCase().includes(query)
        ) {
          results.push({
            id: u.id!,
            type: 'user',
            title: u.name,
            description: `${u.email} - ${u.role}`,
            url: `/dashboard/users/${u.id}`,
            icon: Users,
            metadata: u.department,
          });
        }
      });
    }

    // Buscar en PDIs
    pdis?.forEach(pdi => {
      if (pdi.title.toLowerCase().includes(query) || pdi.objective.toLowerCase().includes(query)) {
        results.push({
          id: pdi.id!.toString(),
          type: 'pdi',
          title: pdi.title,
          description: pdi.objective.substring(0, 100),
          url: `/dashboard/pdi/${pdi.id}`,
          icon: Target,
          metadata: pdi.status,
        });
      }
    });

    // Buscar en normativas (solo managers)
    if (isManager) {
      regulations?.forEach(reg => {
        if (
          reg.name.toLowerCase().includes(query) ||
          reg.description.toLowerCase().includes(query) ||
          reg.type.toLowerCase().includes(query)
        ) {
          results.push({
            id: reg.id!.toString(),
            type: 'compliance',
            title: reg.name,
            description: reg.description.substring(0, 100),
            url: `/dashboard/compliance/${reg.id}`,
            icon: ShieldCheck,
            metadata: reg.type,
          });
        }
      });
    }

    // Buscar en certificados
    certificates?.forEach(cert => {
      if (
        cert.courseName.toLowerCase().includes(query) ||
        cert.userName.toLowerCase().includes(query)
      ) {
        results.push({
          id: cert.id!.toString(),
          type: 'certificate',
          title: `Certificado: ${cert.courseName}`,
          description: `Emitido a ${cert.userName}`,
          url: `/dashboard/certificates/${cert.id}`,
          icon: Award,
          metadata: cert.status,
        });
      }
    });

    // Buscar en eventos
    events?.forEach(event => {
      if (
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      ) {
        results.push({
          id: event.id!.toString(),
          type: 'event',
          title: event.title,
          description: event.description?.substring(0, 100),
          url: `/dashboard/calendar?event=${event.id}`,
          icon: Calendar,
          metadata: event.type,
        });
      }
    });

    // Limitar a 50 resultados
    return results.slice(0, 50);
  }, [searchQuery, courses, users, pdis, regulations, certificates, events, isManager]);

  // Agrupar resultados por tipo
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      course: [],
      user: [],
      pdi: [],
      compliance: [],
      certificate: [],
      event: [],
      resource: [],
    };

    searchResults.forEach(result => {
      groups[result.type].push(result);
    });

    return groups;
  }, [searchResults]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setSearchQuery('');
    router.push(url);
  };

  const typeLabels: Record<SearchResult['type'], string> = {
    course: 'Cursos',
    user: 'Usuarios',
    pdi: 'PDI',
    compliance: 'Normativas',
    certificate: 'Certificados',
    event: 'Eventos',
    resource: 'Recursos',
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar cursos, usuarios, PDI, normativas..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {searchQuery.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          ) : searchResults.length === 0 ? (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm">No se encontraron resultados</p>
                <p className="text-xs text-muted-foreground">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            </CommandEmpty>
          ) : (
            <>
              {/* Cursos */}
              {groupedResults.course.length > 0 && (
                <>
                  <CommandGroup heading={`${typeLabels.course} (${groupedResults.course.length})`}>
                    {groupedResults.course.map(result => (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result.url)}
                      >
                        <result.icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="font-medium">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground">
                              {result.description}
                            </span>
                          )}
                        </div>
                        {result.metadata && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {result.metadata}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Usuarios */}
              {groupedResults.user.length > 0 && (
                <>
                  <CommandGroup heading={`${typeLabels.user} (${groupedResults.user.length})`}>
                    {groupedResults.user.map(result => (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result.url)}
                      >
                        <result.icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="font-medium">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground">
                              {result.description}
                            </span>
                          )}
                        </div>
                        {result.metadata && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {result.metadata}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* PDI */}
              {groupedResults.pdi.length > 0 && (
                <>
                  <CommandGroup heading={`${typeLabels.pdi} (${groupedResults.pdi.length})`}>
                    {groupedResults.pdi.map(result => (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result.url)}
                      >
                        <result.icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="font-medium">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground">
                              {result.description}
                            </span>
                          )}
                        </div>
                        {result.metadata && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {result.metadata}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Normativas */}
              {groupedResults.compliance.length > 0 && (
                <>
                  <CommandGroup
                    heading={`${typeLabels.compliance} (${groupedResults.compliance.length})`}
                  >
                    {groupedResults.compliance.map(result => (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result.url)}
                      >
                        <result.icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="font-medium">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground">
                              {result.description}
                            </span>
                          )}
                        </div>
                        {result.metadata && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {result.metadata}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Certificados */}
              {groupedResults.certificate.length > 0 && (
                <>
                  <CommandGroup
                    heading={`${typeLabels.certificate} (${groupedResults.certificate.length})`}
                  >
                    {groupedResults.certificate.map(result => (
                      <CommandItem
                        key={result.id}
                        value={result.id}
                        onSelect={() => handleSelect(result.url)}
                      >
                        <result.icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="font-medium">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground">
                              {result.description}
                            </span>
                          )}
                        </div>
                        {result.metadata && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {result.metadata}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Eventos */}
              {groupedResults.event.length > 0 && (
                <CommandGroup heading={`${typeLabels.event} (${groupedResults.event.length})`}>
                  {groupedResults.event.map(result => (
                    <CommandItem
                      key={result.id}
                      value={result.id}
                      onSelect={() => handleSelect(result.url)}
                    >
                      <result.icon className="mr-2 h-4 w-4" />
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="font-medium">{result.title}</span>
                        {result.description && (
                          <span className="text-xs text-muted-foreground">
                            {result.description}
                          </span>
                        )}
                      </div>
                      {result.metadata && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {result.metadata}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
