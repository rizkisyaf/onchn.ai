import type { Prisma } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    role: string;
    status: string;
    capabilities: Prisma.JsonValue;
    tasks: {
      id: string;
      description: string;
      status: string;
      priority: number;
      agentId: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const activeTask = agent.tasks[0];
  const progress = activeTask ? Math.round((Date.now() - new Date(activeTask.createdAt).getTime()) / 1000) % 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {agent.name}
        </CardTitle>
        <Badge
          variant={agent.status === 'idle' ? 'secondary' : 'default'}
        >
          {agent.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">
          Role: {agent.role}
        </div>
        {activeTask && (
          <div className="mt-4">
            <div className="text-xs font-medium">Current Task</div>
            <div className="text-xs text-muted-foreground mt-1">
              {activeTask.description}
            </div>
            <Progress
              value={progress}
              className="mt-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 