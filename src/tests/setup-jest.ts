// This file runs before all tests
import type { NextRequest } from 'next/server'

// Mock Next.js response functionality
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, options = {}) => ({
      data,
      ...options,
      status: options?.status || 200,
      headers: new Headers(),
      json: async () => data,
    })),
  },
}))

// Mock the env variables
jest.mock('@/config/env.mjs', () => ({
  env: {
    API_SECRET: 'test-secret-key',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}))

// Mock the Prisma client
jest.mock('@/prisma/db', () => {
  // Create mock functions with proper Jest mock
  const findManyMock = jest.fn();
  const updateMock = jest.fn();
  const updateManyMock = jest.fn();
  const transactionMock = jest.fn();
  const disconnectMock = jest.fn();
  
  return {
    db: {
      leetcoders: {
        findMany: findManyMock,
        update: updateMock,
      },
      submissions: {
        updateMany: updateManyMock,
      },
      roadmap: {
        findMany: findManyMock,
      },
      $transaction: transactionMock.mockImplementation((callbacks) => {
        if (Array.isArray(callbacks)) {
          return Promise.resolve(callbacks.map(callback => {
            if (typeof callback === 'function') {
              return callback();
            }
            return { id: 'user1', status: 'SUSPENDED' };
          }));
        }
        return Promise.resolve([{ id: 'user1', status: 'SUSPENDED' }]);
      }),
      $disconnect: disconnectMock,
    },
  };
}) 