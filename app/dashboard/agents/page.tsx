import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { AgentCard } from '@/components/agents/AgentCard';
import { CreateAgentForm } from '@/components/agents/CreateAgentForm';
import { CreateTaskForm } from '@/components/agents/CreateTaskForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

async function getAgents() {
  return prisma.agent.findMany({
    include: {
      tasks: {
        where: {
          status: 'in_progress',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });
}

function AgentSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[125px] w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="create-agent">Create Agent</TabsTrigger>
          <TabsTrigger value="create-task">Create Task</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="text-xl font-bold">Active Agents</div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Suspense
              fallback={[1, 2, 3].map((i) => (
                <AgentSkeleton key={i} />
              ))}
            >
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="create-agent">
          <div className="max-w-2xl mx-auto">
            <div className="text-xl font-bold mb-6">Create New Agent</div>
            <CreateAgentForm />
          </div>
        </TabsContent>

        <TabsContent value="create-task">
          <div className="max-w-2xl mx-auto">
            <div className="text-xl font-bold mb-6">Create New Task</div>
            <CreateTaskForm agents={agents} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 