require('@testing-library/jest-dom');
require('openai/shims/node');

// Mock fetch
global.fetch = jest.fn();

// Mock Request
global.Request = class Request {
  constructor(input, init) {
    this.input = input;
    this.init = init;
  }
};

// Mock Redis
const RedisMock = require('ioredis-mock');
class MockRedis extends RedisMock {
  constructor() {
    super();
    this.Cluster = class Cluster {
      constructor() {
        return new MockRedis();
      }
    };
  }

  async flushall() {
    return 'OK';
  }

  async get(key) {
    return null;
  }

  async set(key, value) {
    return 'OK';
  }

  async del(key) {
    return 1;
  }

  async incr(key) {
    return 1;
  }

  async decr(key) {
    return 1;
  }

  async expire(key, seconds) {
    return 1;
  }

  async ttl(key) {
    return -1;
  }
}

jest.mock('ioredis', () => {
  const mock = jest.fn().mockImplementation(() => new MockRedis());
  mock.Cluster = MockRedis.prototype.Cluster;
  mock.prototype = MockRedis.prototype;
  return mock;
});

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000000',
}));

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn(() => ({
    getSignaturesForAddress: jest.fn(),
    getRecentBlockhash: jest.fn(),
    sendTransaction: jest.fn(),
    confirmTransaction: jest.fn(),
    getParsedTokenAccountsByOwner: jest.fn(),
    getTokenAccountBalance: jest.fn(),
    getAccountInfo: jest.fn(),
  })),
  PublicKey: jest.fn(() => ({
    toString: () => 'mock-public-key',
    toBase58: () => 'mock-public-key',
  })),
  Transaction: {
    from: jest.fn(() => ({
      add: jest.fn(),
      sign: jest.fn(),
      serialize: jest.fn(),
    })),
  },
}));

