import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgentService } from '@/lib/services/agent';
import { getServerSession } from 'next-auth';

const agentService = new AgentService();

export async function POST(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = params;
    const body = await req.json();
    const { description, priority, dependencies } = body;

    // Create task in memory
    const task = await agentService.assignTask(agentId, {
      description,
      priority,
      dependencies,
    });

    // Persist to database
    const dbTask = await prisma.task.create({
      data: {
        id: task.id,
        description: task.description,
        priority: task.priority,
        status: task.status,
        agentId: task.agentId,
        dependencies: {
          connect: dependencies?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        agent: true,
        dependencies: true,
      },
    });

    return NextResponse.json(dbTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = params;
    const tasks = await prisma.task.findMany({
      where: {
        agentId,
      },
      include: {
        agent: true,
        dependencies: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 