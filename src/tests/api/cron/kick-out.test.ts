// Mock Prisma client functions
const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
const mockUpdateMany = jest.fn()
const mockDisconnect = jest.fn()

// Mock environment configuration
jest.mock('@/config/env.mjs', () => ({
  env: {
    API_SECRET: 'test-secret-key',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}))

// Mock waitUntil
jest.mock('@vercel/functions', () => ({
  waitUntil: jest.fn((promise) => promise),
}))

// Mock p-limit
jest.mock('p-limit', () => {
  return jest.fn(() => (fn: any) => fn())
})

// Mock Prisma client
jest.mock('@/prisma/db', () => ({
  db: {
    leetcoders: {
      findMany: mockFindMany,
      update: mockUpdate,
    },
    roadmap: {
      findMany: mockFindMany,
    },
    submissions: {
      updateMany: mockUpdateMany,
    },
    $disconnect: mockDisconnect,
  },
}))

// Mock admin notification
jest.mock('@/utils/email/sendAdminNotification', () => ({
  sendAdminNotification: jest.fn(),
}))

// Mock reminder email
jest.mock('@/utils/email/sendReminderEmail', () => ({
  sendReminderEmail: jest.fn(),
}))

// Now import the modules
import { POST, processLeetcoder } from '@/app/api/cron/kick-out/route'
import {
  getUniqueGroupNos,
  kickOffLeetcoders,
  getSolvedProblems,
  calculateUnsolvedProblems,
} from '@/utils/kickoutUtils'
import type { leetcoders, submissions } from '@prisma/client'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { sendReminderEmail } from '@/utils/email/sendReminderEmail'
import { db } from '@/prisma/db'
import { waitUntil } from '@vercel/functions'

// Type definition for the LeetcoderWithSubmissions
interface LeetcoderWithSubmissions {
  id: string
  group_no: number
  created_at: Date
  email: string
  is_notified: boolean
  submissions: Pick<submissions, 'problem_id'>[]
}

describe('kick-out API route', () => {
  const mockRequest = (secret?: string) => {
    return new Request('https://example.com/api/cron/kick-out', {
      method: 'POST',
      headers: secret ? { 'X-Secret-Key': secret } : {},
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST handler', () => {
    it('should return 401 if the secret is missing', async () => {
      const req = mockRequest()
      const response = await POST(req)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ success: false, error: 'UNAUTHORIZED' })
    })

    it('should return 401 if the secret is incorrect', async () => {
      const req = mockRequest('wrong-secret')
      const response = await POST(req)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ success: false, error: 'UNAUTHORIZED' })
    })

    it('should process leetcoders and return success with correct summary', async () => {
      // Setup mocks for all dependencies
      const mockLeetcoder = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
        email: 'test@example.com',
        submissions: [{ problem_id: 'prob1' }],
      }

      // Mock database calls
      mockFindMany
        .mockResolvedValueOnce([mockLeetcoder]) // getAllLeetcoders
        .mockResolvedValueOnce([{ group_no: 1 }]) // getUniqueGroupNos
        .mockResolvedValueOnce([ // getAllAssignedProblems
          { id: 'problem1', group_progress: [{ group_no: 1 }] },
          { id: 'problem2', group_progress: [{ group_no: 1 }] },
          { id: 'problem3', group_progress: [{ group_no: 1 }] },
          { id: 'problem4', group_progress: [{ group_no: 1 }] },
          { id: 'problem5', group_progress: [{ group_no: 1 }] },
          { id: 'problem6', group_progress: [{ group_no: 1 }] },
          { id: 'problem7', group_progress: [{ group_no: 1 }] },
          { id: 'problem8', group_progress: [{ group_no: 1 }] },
        ])

      // Mock email sending
      jest.mocked(sendReminderEmail).mockResolvedValueOnce(undefined)
      mockUpdate.mockResolvedValueOnce({ id: 'user1' })

      // Mock waitUntil to actually wait for the promise
      jest.mocked(waitUntil).mockImplementation(async (promise) => {
        await promise
        return promise
      })

      // Mock sendAdminNotification to resolve immediately
      jest.mocked(sendAdminNotification).mockResolvedValue(undefined)

      // Act
      const req = mockRequest('test-secret-key')
      const response = await POST(req)

      // Log the response for debugging
      console.log('Response status:', response.status)
      const responseData = await response.json()
      console.log('Response data:', responseData)

      // Assert
      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        data: {
          summary: {
            total: 1,
            successful: 1,
            failed: 0,
            notified: 1,
            kicked: 0,
          },
        },
      })
      expect(sendAdminNotification).toHaveBeenCalledWith({
        event: 'KICK_OUT_SUMMARY',
        message: '/api/cron/kick-out',
        summary: expect.any(String),
      })
      expect(mockDisconnect).toHaveBeenCalled()
    })

    it('should handle errors properly and send admin notification', async () => {
      // Arrange
      mockFindMany.mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      // Act
      const req = mockRequest('test-secret-key')
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
      })
      expect(sendAdminNotification).toHaveBeenCalledWith({
        event: 'KICK_OUT_CRON_ERROR',
        error: expect.any(String),
        message: 'Error in /api/cron/kick-out',
      })
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('processLeetcoder', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should update notification status if threshold exceeded and not notified', async () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
        email: 'test@example.com',
        submissions: [{ problem_id: 'prob1' }],
      }
      const assignedProblems = Array(10)
        .fill(0)
        .map((_, i) => ({ id: `prob${i + 1}` }))
      
      // Mock email sending
      jest.mocked(sendReminderEmail).mockResolvedValueOnce(undefined)
      mockUpdate.mockResolvedValueOnce({ id: 'user1' })

      // Act
      await processLeetcoder(leetcoder, assignedProblems, 6)

      // Assert
      expect(sendReminderEmail).toHaveBeenCalledWith({
        group_no: '1',
        email: 'test@example.com',
      })
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { is_notified: true },
      })
    })

    it('should kick off if threshold exceeded and already notified', async () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: true,
        email: 'test@example.com',
        submissions: [{ problem_id: 'prob1' }],
      }
      const assignedProblems = Array(10)
        .fill(0)
        .map((_, i) => ({ id: `prob${i + 1}` }))
      mockUpdate.mockResolvedValueOnce({
        id: 'user1',
        status: 'SUSPENDED',
      })
      mockUpdateMany.mockResolvedValueOnce({ count: 1 })

      // Act
      await processLeetcoder(leetcoder, assignedProblems, 6)

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { status: 'SUSPENDED' },
      })
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { user_id: 'user1' },
        data: { solved: false },
      })
    })

    it('should not take action if assigned problems are below threshold', async () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
        email: 'test@example.com',
        submissions: [{ problem_id: 'prob1' }],
      }
      const assignedProblems = [{ id: 'prob1' }, { id: 'prob2' }]

      // Act
      await processLeetcoder(leetcoder, assignedProblems, 6)

      // Assert
      expect(sendReminderEmail).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
      expect(mockUpdateMany).not.toHaveBeenCalled()
    })

    it('should not take action if unsolved problems are below threshold', async () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
        email: 'test@example.com',
        submissions: [
          { problem_id: 'prob1' },
          { problem_id: 'prob2' },
          { problem_id: 'prob3' },
          { problem_id: 'prob4' },
          { problem_id: 'prob5' },
        ],
      }
      const assignedProblems = Array(10)
        .fill(0)
        .map((_, i) => ({ id: `prob${i + 1}` }))

      // Act
      await processLeetcoder(leetcoder, assignedProblems, 6)

      // Assert
      expect(sendReminderEmail).not.toHaveBeenCalled()
      expect(mockUpdate).not.toHaveBeenCalled()
      expect(mockUpdateMany).not.toHaveBeenCalled()
    })
  })
})
