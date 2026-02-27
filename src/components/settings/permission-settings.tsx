// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import type { Role, RolePermission } from '@/lib/types';
import { roles } from '@/lib/data';
import { getNavItems } from '@/lib/nav';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function PermissionSettings() {
    const { toast } = useToast();
    const allNavItems = getNavItems();
    const allRoles: Role[] = [...roles];

    const dbPermissions = useLiveQuery(() => db.db.rolePermissions.toArray());
    const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (dbPermissions) {
            const permsMap = dbPermissions.reduce((acc, p) => {
                acc[p.role] = p.visibleNavs;
                return acc;
            }, {} as Record<string, string[]>);
            setLocalPermissions(permsMap);
            setIsLoading(false);
        }
    }, [dbPermissions]);

    const handleToggle = (role: Role, navHref: string, checked: boolean) => {
        setLocalPermissions(prev => {
            const currentNavs = prev[role] || [];
            const newNavs = checked
                ? [...currentNavs, navHref]
                : currentNavs.filter(href => href !== navHref);
            return { ...prev, [role]: newNavs };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            for (const role in localPermissions) {
                await db.updatePermissionsForRole(role as Role, localPermissions[role]);
            }
            toast({
                title: 'Permisos Guardados',
                description: 'Los permisos de visibilidad para todos los roles han sido actualizados.',
            });
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'No se pudieron guardar los permisos.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Permisos de Navegación por Rol</CardTitle>
                    <CardDescription>
                        Gestiona qué secciones del menú lateral son visibles para cada rol de usuario en la aplicación.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {allRoles.map(role => (
                        <Card key={role} className="p-4">
                            <h3 className="font-semibold mb-4 text-primary">{role}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allNavItems.map(navItem => (
                                    <div key={navItem.href} className="flex items-center justify-between space-x-2 rounded-md border p-3">
                                        <Label htmlFor={`perm-${role}-${navItem.href}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {navItem.label}
                                        </Label>
                                        <Switch
                                            id={`perm-${role}-${navItem.href}`}
                                            checked={localPermissions[role]?.includes(navItem.href) ?? false}
                                            onCheckedChange={(checked) => handleToggle(role, navItem.href, checked)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
             <div className="flex justify-end">
                <Button size="lg" onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Permisos
                </Button>
            </div>
        </div>
    );
}
