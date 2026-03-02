'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import type { User, ForumMessageWithReplies } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';
import { ForumMessageCard } from './forum-message-card';

interface ForumProps {
  courseId: string;
  user: User;
  canManage: boolean;
}

export function Forum({ courseId, user, canManage }: ForumProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const messages = useLiveQuery(
    () => db.getForumMessages(courseId),
    [courseId],
    [] as ForumMessageWithReplies[]
  );

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return;
    setIsPosting(true);

    try {
      await db.addForumMessage({
        courseId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        message: newMessage,
        timestamp: new Date().toISOString(),
        parentId: null,
      });
      setNewMessage('');
      toast({ title: 'Mensaje publicado' });
    } catch (error) {
      console.error('Failed to post message', error);
      toast({
        title: 'Error',
        description: 'No se pudo publicar el mensaje.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Foro de Discusión</CardTitle>
        <CardDescription>
          Haz preguntas, comparte ideas y colabora con otros participantes del curso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Post new message form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Inicia una nueva discusión..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            rows={3}
            disabled={isPosting}
          />
          <div className="flex justify-end">
            <Button onClick={handlePostMessage} disabled={isPosting || !newMessage.trim()}>
              {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-6">
          {messages === undefined && (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {messages && messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12" />
              <p className="mt-2">No hay discusiones todavía.</p>
              <p className="text-sm">¡Sé el primero en iniciar una!</p>
            </div>
          )}
          {messages &&
            messages.map(msg => (
              <ForumMessageCard
                key={msg.id}
                message={msg}
                courseId={courseId}
                user={user}
                canManage={canManage}
                isTopLevel
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
