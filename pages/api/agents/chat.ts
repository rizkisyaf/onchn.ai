import { Server } from 'ws';
import { NextApiRequest } from 'next';
import { prisma } from '@/lib/prisma';
import { AgentService } from '@/lib/services/agent';
import { parse } from 'url';

const agentService = new AgentService();
const wss = new Server({ noServer: true });
const clients = new Map();

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.ws) {
    res.socket.server.ws = wss;

    res.socket.server.on('upgrade', (request: any, socket: any, head: any) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    wss.on('connection', async (ws, request) => {
      const { query } = parse(request.url!, true);
      const { sourceId, targetId } = query;

      if (!sourceId || !targetId) {
        ws.close();
        return;
      }

      // Store client connection
      const chatId = `${sourceId}-${targetId}`;
      clients.set(chatId, ws);

      // Load recent messages
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            {
              agentId: sourceId as string,
              metadata: {
                path: ['targetAgentId'],
                equals: targetId,
              },
            },
            {
              agentId: targetId as string,
              metadata: {
                path: ['targetAgentId'],
                equals: sourceId,
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      // Send recent messages
      ws.send(JSON.stringify({
        type: 'init',
        messages: messages.reverse(),
      }));

      // Handle incoming messages
      ws.on('message', async (data: string) => {
        try {
          const message = JSON.parse(data);
          
          // Store message
          const storedMessage = await prisma.message.create({
            data: {
              content: message.content,
              type: message.type,
              agentId: sourceId as string,
              metadata: {
                targetAgentId: targetId,
                ...message.metadata,
              },
            },
          });

          // Send to target agent
          const targetWs = clients.get(`${targetId}-${sourceId}`);
          if (targetWs) {
            targetWs.send(JSON.stringify(storedMessage));
          }

          // Process message with agent service
          await agentService.sendMessage({
            id: storedMessage.id,
            agentId: targetId as string,
            content: message.content,
            type: message.type,
            timestamp: Date.now(),
            metadata: message.metadata,
          });

          // Send confirmation back to source
          ws.send(JSON.stringify({
            type: 'confirmation',
            messageId: storedMessage.id,
          }));
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message',
          }));
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        clients.delete(chatId);
      });
    });
  }

  res.end();
} 