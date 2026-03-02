'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Loader2, List, Trash2 } from 'lucide-react';

import * as db from '@/lib/db';
import type { CustomCostCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function CategoryManagerPage() {
  const { toast } = useToast();
  const categories = useLiveQuery(() => db.getAllCostCategories(), []);
  const [newCategory, setNewCategory] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<CustomCostCategory | null>(null);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await db.addCostCategory({ name: newCategory.trim() });
      toast({ title: 'Categoría añadida' });
      setNewCategory('');
    } catch (error: any) {
      if (error.name === 'ConstraintError') {
        toast({ title: 'Error', description: 'Esa categoría ya existe.', variant: 'destructive' });
      } else {
        console.error(error);
        toast({
          title: 'Error',
          description: 'No se pudo añadir la categoría.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete?.id) return;
    try {
      await db.deleteCostCategory(categoryToDelete.id);
      toast({ title: 'Categoría eliminada' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría.',
        variant: 'destructive',
      });
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/costs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Gestión de Costes
        </Link>
      </Button>

      <AlertDialog>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List /> Gestionar Categorías de Costes
            </CardTitle>
            <CardDescription>
              Añade o elimina categorías de costes para toda la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de la nueva categoría"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                />
                <Button onClick={handleAddCategory}>Añadir</Button>
              </div>
              <div className="border rounded-lg p-2 space-y-1 max-h-64 overflow-y-auto">
                {!categories ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  categories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md"
                    >
                      <span className="text-sm">{cat.name}</span>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setCategoryToDelete(cat)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </div>
                  ))
                )}
              </div>
            </div>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará la categoría "{categoryToDelete?.name}". Esto no afectará a los
                  gastos ya existentes con esta categoría.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCategory}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </CardContent>
        </Card>
      </AlertDialog>
    </div>
  );
}
