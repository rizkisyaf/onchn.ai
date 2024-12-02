import type { Prisma } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgentMemoryProps {
  agent: {
    id: string;
    name: string;
    role: string;
    status: string;
    capabilities: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  };
  memories: {
    id: string;
    type: string;
    content: Prisma.JsonValue;
    metadata: Prisma.JsonValue;
    timestamp: bigint;
    agentId: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export function AgentMemory({ agent, memories }: AgentMemoryProps) {
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Memory: {agent.name}</CardTitle>
        <div className="flex items-center gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="conversation">Conversation</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="knowledge">Knowledge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="p-4 rounded-lg border bg-card text-card-foreground"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{memory.type}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(Number(memory.timestamp)).toLocaleString()}
                  </span>
                </div>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(memory.content, null, 2)}
                </pre>
                {memory.metadata && (
                  <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                    <div className="font-medium mb-1">Metadata:</div>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(memory.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {memories.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No memories stored
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 