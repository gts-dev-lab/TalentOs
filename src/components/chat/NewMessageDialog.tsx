'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { User, Role } from '@/lib/types';

export function NewMessageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const allUsers = useLiveQuery(() => db.getAllUsers(), []);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectUser = async (targetUser: User) => {
    if (!authUser || authUser.id === targetUser.id) return;

    try {
      const channel = await db.getOrCreateDirectMessageThread(authUser.id, targetUser.id);
      router.push(`/dashboard/chat?channelId=${channel.id}`);
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error('Failed to start chat', error);
      // Optionally, add a toast here for user feedback
    }
  };

  const filteredUsers = useMemo(() => {
    if (!allUsers || !authUser) return [];

    // Define administrative/support roles that a 'Trabajador' can contact
    const contactableRoles: Role[] = [
      'Formador',
      'Gestor de RRHH',
      'Jefe de Formación',
      'Administrador General',
    ];

    let usersToShow = allUsers;

    // If the current user is a 'Trabajador', only show users with contactable roles
    if (authUser.role === 'Trabajador') {
      usersToShow = allUsers.filter(user => contactableRoles.includes(user.role));
    }

    // Always filter out the current user themselves and apply the search term
    return usersToShow.filter(
      user => user.id !== authUser.id && user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, authUser, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Mensaje Directo</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-72">
            <div className="space-y-1 pr-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted text-left"
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">
                  No se encontraron usuarios.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
