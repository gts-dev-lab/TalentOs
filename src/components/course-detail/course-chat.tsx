'use client';

import { useState } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import { courseTutor } from '@/ai/flows/course-tutor';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export function CourseChat({
  courseTitle,
  courseContent,
}: {
  courseTitle: string;
  courseContent: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const historyForAI = newMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : ('model' as 'user' | 'model'),
      text: msg.text,
    }));

    try {
      const result = await courseTutor({
        courseContent,
        question: input,
        history: historyForAI,
      });
      const aiMessage: ChatMessage = { sender: 'ai', text: result.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorText = error.message?.includes('API no está configurada')
        ? error.message
        : 'Lo siento, no he podido procesar tu pregunta. Por favor, inténtalo de nuevo.';
      const errorMessage: ChatMessage = { sender: 'ai', text: errorText };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error with course tutor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot /> Tutor de IA para {courseTitle}
        </CardTitle>
        <CardDescription>Haz preguntas sobre el contenido del curso.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto space-y-4 p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}
          >
            {msg.sender === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
            <div
              className={`flex flex-col w-full max-w-md leading-1.5 p-4 border-gray-200 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-s-xl rounded-ee-xl' : 'bg-gray-100 rounded-e-xl rounded-es-xl'}`}
            >
              <p className="text-sm font-normal text-current">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2.5">
            <Bot className="h-6 w-6 text-primary flex-shrink-0" />
            <div className="flex flex-col w-full max-w-md leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 border-t">
        <form onSubmit={handleSendMessage} className="relative w-full">
          <Input
            placeholder="Escribe tu pregunta..."
            className="pr-12"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <Button
            size="icon"
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
