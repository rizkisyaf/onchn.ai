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
    const { type, content } = body;

    // Store memory in vector DB and get the vector ID
    const vectorId = await agentService.storeMemory(agentId, {
      type,
      content,
    });

    // Persist to database
    const memory = await prisma.memory.create({
      data: {
        type,
        content,
        metadata: {},
        timestamp: BigInt(Date.now()),
        agentId,
        vectorId,
      },
    });

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Error storing memory:', error);
    return NextResponse.json(
      { error: 'Failed to store memory' },
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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const query = searchParams.get('query');

    let memories;

    if (query) {
      // Semantic search in vector DB
      const vectorResults = await agentService.searchMemory(agentId, query);
      const vectorIds = vectorResults.map((r: { id: string }) => r.id);

      memories = await prisma.memory.findMany({
        where: {
          agentId,
          ...(vectorIds.length > 0 ? { vectorId: { in: vectorIds } } : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Sort memories based on vector search relevance
      memories.sort((a, b) => {
        if (!a.vectorId || !b.vectorId) return 0;
        const aIndex = vectorIds.indexOf(a.vectorId);
        const bIndex = vectorIds.indexOf(b.vectorId);
        return aIndex - bIndex;
      });
    } else {
      // Regular DB query
      memories = await prisma.memory.findMany({
        where: {
          agentId,
          ...(type ? { type } : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return NextResponse.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
} 