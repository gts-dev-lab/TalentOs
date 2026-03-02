'use client';

import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const ChatMessageItem = React.memo(function ChatMessageItem({
  message,
  isCurrentUser,
}: {
  message: ChatMessage;
  isCurrentUser: boolean;
}) {
  return (
    <div className={cn('flex items-start gap-3', isCurrentUser && 'flex-row-reverse')}>
      <Avatar className="h-9 w-9">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback>{message.userName.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className={cn('flex flex-col gap-1', isCurrentUser && 'items-end')}>
        <div
          className={cn(
            'p-3 rounded-lg max-w-sm',
            isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          <p className="text-sm font-semibold mb-1">{message.userName}</p>
          <p className="text-sm break-words">{message.message}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  );
});
ChatMessageItem.displayName = 'ChatMessageItem';
