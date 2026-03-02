'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { User, ForumMessageWithReplies } from '@/lib/types';
import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface ForumMessageCardProps {
  message: ForumMessageWithReplies;
  courseId: string;
  user: User;
  canManage: boolean;
  isTopLevel?: boolean;
}

export function ForumMessageCard({
  message,
  courseId,
  user,
  canManage,
  isTopLevel = false,
}: ForumMessageCardProps) {
  const { toast } = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePostReply = async () => {
    if (!replyMessage.trim()) return;
    setIsPostingReply(true);

    try {
      await db.addForumMessage({
        courseId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        message: replyMessage,
        timestamp: new Date().toISOString(),
        parentId: message.id!,
      });
      setReplyMessage('');
      setShowReplyForm(false);
      toast({ title: 'Respuesta publicada' });
    } catch (error) {
      console.error('Failed to post reply', error);
      toast({
        title: 'Error',
        description: 'No se pudo publicar la respuesta.',
        variant: 'destructive',
      });
    } finally {
      setIsPostingReply(false);
    }
  };

  const handleDelete = async () => {
    try {
      await db.deleteForumMessage(message.id!);
      toast({ title: 'Mensaje eliminado' });
    } catch (error) {
      console.error('Failed to delete message', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el mensaje.',
        variant: 'destructive',
      });
    }
  };

  const isAuthor = user.id === message.userId;

  return (
    <AlertDialog>
      <div className={`flex gap-4 ${isTopLevel ? 'p-4 border rounded-lg bg-card' : ''}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={message.userAvatar} alt={message.userName} />
          <AvatarFallback>{message.userName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{message.userName}</p>
              <p className="text-xs text-muted-foreground">
                {isClient
                  ? formatDistanceToNow(new Date(message.timestamp), {
                      addSuffix: true,
                      locale: es,
                    })
                  : '...'}
              </p>
            </div>
            {(canManage || isAuthor) && (
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            )}
          </div>
          <p className="mt-2 text-sm">{message.message}</p>
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Responder
            </Button>
          </div>
          {showReplyForm && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder={`Respondiendo a ${message.userName}...`}
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                rows={2}
                disabled={isPostingReply}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowReplyForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handlePostReply} disabled={isPostingReply || !replyMessage.trim()}>
                  {isPostingReply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Respuesta
                </Button>
              </div>
            </div>
          )}
          {message.replies.length > 0 && (
            <div className="mt-4 pt-4 pl-6 border-l-2 space-y-4">
              {message.replies.map(reply => (
                <ForumMessageCard
                  key={reply.id}
                  message={reply}
                  courseId={courseId}
                  user={user}
                  canManage={canManage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que quieres eliminar este mensaje?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente este mensaje y todas sus
            respuestas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
