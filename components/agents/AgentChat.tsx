import type { Prisma } from '@prisma/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface AgentChatProps {
  agent: {
    id: string;
    name: string;
    role: string;
    status: string;
    capabilities: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  };
  messages: {
    id: string;
    content: string;
    role: string;
    timestamp: Date;
    agentId: string;
  }[];
}

export function AgentChat({ agent, messages }: AgentChatProps) {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Handle message submission
            setInput('');
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
} 