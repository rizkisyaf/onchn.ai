import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonitoringService } from '@/lib/services/monitoring';
import { prisma } from '@/lib/prisma';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const monitoring = new MonitoringService();

async function getMonitoringData() {
  const [agents, tasks, metrics, health] = await Promise.all([
    prisma.agent.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
            messages: true,
            memories: true,
          },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),
    monitoring.getMetrics(),
    monitoring.getSystemHealth(),
  ]);

  // Process tasks for time series
  const taskTimeSeries = tasks.reduce((acc: any[], task) => {
    const hour = new Date(task.createdAt).getHours();
    const existing = acc.find((point) => point.hour === hour);
    if (existing) {
      existing.count++;
      if (task.status === 'completed') existing.completed++;
      if (task.status === 'failed') existing.failed++;
    } else {
      acc.push({
        hour,
        count: 1,
        completed: task.status === 'completed' ? 1 : 0,
        failed: task.status === 'failed' ? 1 : 0,
      });
    }
    return acc;
  }, []);

  return {
    agents,
    taskTimeSeries,
    metrics,
    health,
  };
}

function MetricCard({ title, value, description }: { title: string; value: string | number; description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TaskChart({ data }: { data: any[] }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Task Activity (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#82ca9d"
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="failed"
                stroke="#ff7300"
                name="Failed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentMetrics({ agents }: { agents: any[] }) {
  const totalTasks = agents.reduce((sum, agent) => sum + agent._count.tasks, 0);
  const totalMemories = agents.reduce((sum, agent) => sum + agent._count.memories, 0);
  const totalMessages = agents.reduce((sum, agent) => sum + agent._count.messages, 0);

  return (
    <>
      <MetricCard
        title="Active Agents"
        value={agents.length}
        description="Total number of agents in the system"
      />
      <MetricCard
        title="Total Tasks"
        value={totalTasks}
        description="Tasks processed by all agents"
      />
      <MetricCard
        title="Total Memories"
        value={totalMemories}
        description="Memories stored by all agents"
      />
      <MetricCard
        title="Total Messages"
        value={totalMessages}
        description="Messages exchanged between agents"
      />
    </>
  );
}

function SystemMetrics({ health }: { health: any }) {
  const heapUsedMB = Math.round(health.system.memory.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(health.system.memory.heapTotal / 1024 / 1024);
  const uptime = Math.round(health.system.uptime / 60 / 60 * 10) / 10;

  return (
    <>
      <MetricCard
        title="System Status"
        value={health.status}
        description={`Last updated: ${new Date(health.timestamp).toLocaleString()}`}
      />
      <MetricCard
        title="Memory Usage"
        value={`${heapUsedMB}MB / ${heapTotalMB}MB`}
        description="Heap memory usage"
      />
      <MetricCard
        title="Uptime"
        value={`${uptime}h`}
        description="System uptime in hours"
      />
    </>
  );
}

export default async function MonitoringPage() {
  const { agents, taskTimeSeries, health } = await getMonitoringData();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">System Monitoring</h1>
      
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Suspense fallback={<div>Loading agent metrics...</div>}>
          <AgentMetrics agents={agents} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Suspense fallback={<div>Loading system metrics...</div>}>
          <SystemMetrics health={health} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<div>Loading task chart...</div>}>
          <TaskChart data={taskTimeSeries} />
        </Suspense>
      </div>
    </div>
  );
} 