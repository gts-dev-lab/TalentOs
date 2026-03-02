// @ts-nocheck

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { User, Role, Department } from '@/lib/types';
import { roles, departments } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Type for parsed user data, password can be optional before final validation
type ParsedUser = Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt'>;

export default function BulkImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setParsedUsers([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      try {
        const users = parseCsv(text);
        setParsedUsers(users);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Error al procesar el archivo',
          description: err.message,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const parseCsv = (csv: string): ParsedUser[] => {
    const lines = csv.trim().split('\n');
    const header = lines
      .shift()
      ?.trim()
      .split(',')
      .map(h => h.toLowerCase());
    if (
      !header ||
      !['name', 'email', 'password', 'role', 'department'].every(h => header.includes(h))
    ) {
      throw new Error(
        'El encabezado del CSV debe contener: name, email, password, role, department'
      );
    }

    const nameIndex = header.indexOf('name');
    const emailIndex = header.indexOf('email');
    const passwordIndex = header.indexOf('password');
    const roleIndex = header.indexOf('role');
    const departmentIndex = header.indexOf('department');

    return lines.map((line, i) => {
      const values = line.trim().split(',');
      const role = values[roleIndex] as Role;
      const department = values[departmentIndex] as Department;

      if (!roles.includes(role)) {
        throw new Error(`Error en la fila ${i + 2}: El rol '${role}' no es válido.`);
      }
      if (!departments.includes(department)) {
        throw new Error(`Error en la fila ${i + 2}: El departamento '${department}' no es válido.`);
      }
      if (!values[emailIndex]?.includes('@')) {
        throw new Error(
          `Error en la fila ${i + 2}: El email '${values[emailIndex]}' no es válido.`
        );
      }

      return {
        name: values[nameIndex],
        email: values[emailIndex],
        password: values[passwordIndex],
        role,
        department,
      };
    });
  };

  const handleImport = async () => {
    if (parsedUsers.length === 0) {
      toast({ title: 'No hay usuarios para importar', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await db.bulkAddUsers(parsedUsers);
      toast({
        title: 'Importación Exitosa',
        description: `${parsedUsers.length} usuarios han sido añadidos a la plataforma.`,
      });
      router.push('/dashboard/users');
    } catch (error: any) {
      console.error('Failed to bulk import users', error);
      toast({
        title: 'Error en la Importación',
        description: 'No se pudieron importar los usuarios. Revisa que no haya emails duplicados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Usuarios
        </Link>
      </Button>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Importación Masiva de Usuarios</CardTitle>
          <CardDescription>
            Sube un archivo CSV para añadir múltiples usuarios a la vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="csv-file">Archivo CSV</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">
              El archivo debe tener las columnas: name, email, password, role, department.
            </p>
          </div>

          {error && (
            <div className="text-destructive font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {parsedUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Previsualización de Datos</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Departamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.department}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleImport} size="lg" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Confirmar Importación ({parsedUsers.length} usuarios)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
