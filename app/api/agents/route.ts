import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgentService } from '@/lib/services/agent';
import { getServerSession } from 'next-auth';

const agentService = new AgentService();

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, role, capabilities } = body;

    const agent = await agentService.createAgent({
      name,
      role,
      capabilities,
    });

    // Persist to database
    const dbAgent = await prisma.agent.create({
      data: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        status: agent.status,
        capabilities: agent.capabilities,
      },
    });

    return NextResponse.json(dbAgent);
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      include: {
        tasks: {
          where: {
            status: 'in_progress',
          },
        },
      },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
} 