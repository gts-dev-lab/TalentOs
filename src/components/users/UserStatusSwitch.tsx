'use client';

import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { User, UserStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export function UserStatusSwitch({ user, disabled }: { user: User; disabled?: boolean }) {
  const { toast } = useToast();

  const handleStatusToggle = async (userId: string, newStatus: boolean) => {
    try {
      const status: UserStatus = newStatus ? 'approved' : 'suspended';
      await db.updateUserStatus(userId, status);
      toast({
        title: 'Estado actualizado',
        description: 'El estado del usuario ha sido cambiado.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del usuario.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`status-${user.id}`}
        checked={user.status === 'approved'}
        onCheckedChange={checked => handleStatusToggle(user.id, checked)}
        disabled={disabled}
      />
      <Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>
        {user.status === 'approved' ? 'Activo' : 'Inactivo'}
      </Badge>
    </div>
  );
}
