import { rateLimit, getRateLimitInfo, resetRateLimit } from '@/lib/middleware/rateLimit';
import { Redis } from 'ioredis-mock';
import { NextResponse } from 'next/server';

// Mock external services
jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('@/lib/services/monitoring', () => ({
  MonitoringService: jest.fn().mockImplementation(() => ({
    logWarning: jest.fn(),
    logError: jest.fn(),
    logInfo: jest.fn(),
  })),
}));

describe('Rate Limiting Middleware', () => {
  const mockRequest = (ip: string): Request =>
    new Request('http://test.com', {
      headers: new Headers({
        'x-forwarded-for': ip,
      }),
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rateLimit', () => {
    it('should allow requests within limit', async () => {
      const req = mockRequest('127.0.0.1');
      const result = await rateLimit(req, 'default');
      expect(result).toBeNull();
    });

    it('should block requests over limit', async () => {
      const req = mockRequest('127.0.0.1');
      const promises = Array(101).fill(null).map(() => rateLimit(req, 'default'));
      const results = await Promise.all(promises);
      
      const blockedRequests = results.filter((r) => r instanceof NextResponse);
      expect(blockedRequests.length).toBeGreaterThan(0);

      const lastBlocked = blockedRequests[blockedRequests.length - 1] as NextResponse;
      const body = await lastBlocked.json();
      expect(body.error).toBe('Too many requests');
      expect(lastBlocked.status).toBe(429);
    });

    it('should apply different limits for different endpoints', async () => {
      const req = mockRequest('127.0.0.1');
      
      // Test agent endpoint (50 requests/minute)
      const agentPromises = Array(51).fill(null).map(() => rateLimit(req, 'agent'));
      const agentResults = await Promise.all(agentPromises);
      const blockedAgentRequests = agentResults.filter((r) => r instanceof NextResponse);
      expect(blockedAgentRequests.length).toBe(1);

      // Test chat endpoint (300 requests/minute)
      const chatPromises = Array(301).fill(null).map(() => rateLimit(req, 'chat'));
      const chatResults = await Promise.all(chatPromises);
      const blockedChatRequests = chatResults.filter((r) => r instanceof NextResponse);
      expect(blockedChatRequests.length).toBe(1);
    });

    it('should use default limit for unknown endpoints', async () => {
      const req = mockRequest('127.0.0.1');
      const promises = Array(101).fill(null).map(() => rateLimit(req, 'unknown'));
      const results = await Promise.all(promises);
      
      const blockedRequests = results.filter((r) => r instanceof NextResponse);
      expect(blockedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit info for IP', async () => {
      const ip = '127.0.0.1';
      const endpoint = 'default';

      // Make some requests
      const req = mockRequest(ip);
      await Promise.all(Array(50).fill(null).map(() => rateLimit(req, endpoint)));

      const info = await getRateLimitInfo(ip, endpoint);
      expect(info).toBeDefined();
      expect(info?.remainingPoints).toBeLessThan(100);
      expect(info?.isBlocked).toBe(false);
    });

    it('should return null on error', async () => {
      const info = await getRateLimitInfo('invalid-ip', 'invalid-endpoint');
      expect(info).toBeNull();
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for IP', async () => {
      const ip = '127.0.0.1';
      const endpoint = 'default';

      // Make some requests
      const req = mockRequest(ip);
      await Promise.all(Array(50).fill(null).map(() => rateLimit(req, endpoint)));

      // Check points consumed
      const beforeReset = await getRateLimitInfo(ip, endpoint);
      expect(beforeReset?.remainingPoints).toBeLessThan(100);

      // Reset limit
      const resetResult = await resetRateLimit(ip, endpoint);
      expect(resetResult).toBe(true);

      // Check points reset
      const afterReset = await getRateLimitInfo(ip, endpoint);
      expect(afterReset?.remainingPoints).toBe(100);
    });

    it('should handle reset errors', async () => {
      const resetResult = await resetRateLimit('invalid-ip', 'invalid-endpoint');
      expect(resetResult).toBe(false);
    });
  });
}); 