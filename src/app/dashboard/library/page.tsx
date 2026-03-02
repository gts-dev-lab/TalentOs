'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PlusCircle,
  Trash2,
  FileText,
  Link as LinkIcon,
  Video,
  Loader2,
  FileUp,
} from 'lucide-react';

import * as db from '@/lib/db';
import type { Resource, ResourceType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const resourceTypeIcons: Record<ResourceType, React.ElementType> = {
  pdf: FileText,
  document: FileText,
  link: LinkIcon,
  video: Video,
};

function AddResourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<ResourceType | undefined>();
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setType(undefined);
    setUrl('');
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    if (e.target.files?.[0]) {
      setName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) {
      toast({
        title: 'Error',
        description: 'Nombre y tipo son obligatorios.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    let resourceUrl = url;

    if (file) {
      resourceUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target?.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    }

    if (!resourceUrl) {
      toast({
        title: 'Error',
        description: 'Debes proporcionar una URL o subir un archivo.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      await db.addResource({
        name,
        type,
        url: resourceUrl,
        uploadedAt: new Date().toISOString(),
      });
      toast({ title: 'Éxito', description: 'El recurso ha sido añadido.' });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el recurso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Recurso</DialogTitle>
        </DialogHeader>
        <form id="resource-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resource-name">Nombre del Recurso</Label>
            <Input
              id="resource-name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-type">Tipo de Recurso</Label>
            <Select onValueChange={(v: ResourceType) => setType(v)} value={type}>
              <SelectTrigger id="resource-type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="document">Documento (Word, etc.)</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="link">Enlace Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="resource-url">URL del Enlace</Label>
              <Input
                id="resource-url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                placeholder="https://..."
              />
            </div>
          )}
          {type && type !== 'link' && (
            <div className="space-y-2">
              <Label htmlFor="resource-file">Subir Archivo</Label>
              <Input id="resource-file" type="file" onChange={handleFileChange} required />
            </div>
          )}
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="resource-form" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Recurso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LibraryPage() {
  const { toast } = useToast();
  const resources = useLiveQuery(() => db.getAllResources(), []);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!resourceToDelete?.id) return;
    try {
      await db.deleteResource(resourceToDelete.id);
      toast({ title: 'Éxito', description: 'El recurso ha sido eliminado.' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el recurso.',
        variant: 'destructive',
      });
    } finally {
      setResourceToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Recursos</h1>
          <p className="text-muted-foreground">
            Gestiona los materiales de estudio para todos los cursos.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Recurso
        </Button>
      </div>

      <AlertDialog
        open={!!resourceToDelete}
        onOpenChange={open => !open && setResourceToDelete(null)}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recursos Disponibles</CardTitle>
            <CardDescription>Lista de todos los materiales en la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            {!resources ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileUp className="mx-auto h-12 w-12" />
                <p className="mt-4 font-semibold">La biblioteca está vacía.</p>
                <p className="text-sm">Añade tu primer recurso para empezar.</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Tipo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha de subida</TableHead>
                      <TableHead className="w-[100px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map(resource => {
                      const Icon = resourceTypeIcons[resource.type];
                      return (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </TableCell>
                          <TableCell className="font-medium">{resource.name}</TableCell>
                          <TableCell>
                            {format(new Date(resource.uploadedAt), 'd MMM, yyyy', { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setResourceToDelete(resource)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Seguro que quieres eliminar este recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El recurso "{resourceToDelete?.name}" se eliminará
              de la biblioteca y se desvinculará de todos los cursos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResourceToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddResourceDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
