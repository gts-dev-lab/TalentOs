'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, Search } from 'lucide-react';

import * as db from '@/lib/db';
import { useAuth } from '@/contexts/auth';
import type { User, Course } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { InstructorCard } from '@/components/instructors/instructor-card';

export default function InstructorsPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const allUsers = useLiveQuery(() => db.getAllUsers(), []);
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);

  const instructors = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(user => user.role === 'Formador');
  }, [allUsers]);

  const filteredInstructors = useMemo(() => {
    if (!instructors) return [];
    return instructors.filter(instructor =>
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [instructors, searchQuery]);

  const coursesByInstructor = useMemo(() => {
    if (!allCourses || !instructors) return new Map<string, Course[]>();
    const map = new Map<string, Course[]>();
    instructors.forEach(instructor => {
      const assigned = allCourses.filter(course => course.instructor === instructor.name);
      map.set(instructor.id, assigned);
    });
    return map;
  }, [allCourses, instructors]);

  if (!allUsers || !allCourses || !currentUser) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Formadores</h1>
        <p className="text-muted-foreground">
          Supervisa, asigna y comunícate con los responsables de la formación.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar formador por nombre..."
          className="pl-8 md:w-1/3"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredInstructors.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredInstructors.map(instructor => (
            <InstructorCard
              key={instructor.id}
              instructor={instructor}
              assignedCourses={coursesByInstructor.get(instructor.id) || []}
              currentUser={currentUser}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-24 text-center">
          <p className="text-lg font-semibold text-muted-foreground">
            {searchQuery ? 'No se encontraron formadores' : 'No hay formadores registrados'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery
              ? 'Intenta con otro nombre.'
              : 'Añade un usuario con el rol de "Formador" en la sección de Usuarios.'}
          </p>
        </div>
      )}
    </div>
  );
}
