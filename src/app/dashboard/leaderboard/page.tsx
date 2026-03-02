'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { departments } from '@/lib/data';

export default function LeaderboardPage() {
  const users = useLiveQuery(() => db.getAllUsers(), []);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const sortedUsers = useMemo(() => {
    if (!users) return [];

    const filtered =
      departmentFilter === 'all'
        ? users
        : users.filter(user => user.department === departmentFilter);

    return filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [users, departmentFilter]);

  if (!users) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 1) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-orange-400" />;
    return <span className="font-bold text-lg w-6 text-center">{rank + 1}</span>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Clasificación General</h1>
        <p className="text-muted-foreground">
          Compite con tus compañeros y gana puntos completando formaciones.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle>Top de la Organización</CardTitle>
            <CardDescription>
              Usuarios con la mayor cantidad de puntos de experiencia (XP).
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto sm:max-w-xs mt-4 sm:mt-0">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Departamentos</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rango</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user, index) => (
                  <TableRow key={user.id} className={index < 3 ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium text-center">{getRankIcon(index)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell className="text-right text-lg font-bold text-primary">
                      {user.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
