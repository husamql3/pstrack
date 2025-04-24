import {
  POST,
  getUniqueGroupNos,
  kickOffLeetcoders,
  getSolvedProblems,
  calculateUnsolvedProblems,
  processLeetcoder,
} from '@/app/api/cron/kick-out/route'
import { env } from '@/config/env.mjs'
import { db } from '@/prisma/db'
import type { leetcoders, submissions } from '@prisma/client'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

// Mock the database
jest.mock('@/prisma/db', () => ({
  db: {
    leetcoders: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    roadmap: {
      findMany: jest.fn(),
    },
    submissions: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

// Typing from the original file
interface LeetcoderWithSubmissions {
  id: string
  group_no: number
  created_at: Date
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
    // Set default mock responses
    NextResponse.json.mockImplementation((data, opts = {}) => ({
      data,
      status: opts.status || 200,
      json: async () => data,
    }))
  })

  describe('POST handler', () => {
    it('should return 401 if the secret is missing', async () => {
      // Act
      const req = mockRequest()
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ success: false, error: 'UNAUTHORIZED' })
      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    })

    it('should return 401 if the secret is incorrect', async () => {
      // Act
      const req = mockRequest('wrong-secret')
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ success: false, error: 'UNAUTHORIZED' })
      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    })

    it('should process leetcoders and return success', async () => {
      // Setup mocks for all dependencies

      // Mock getAllLeetcoders response
      db.leetcoders.findMany.mockResolvedValueOnce([
        {
          id: 'user1',
          group_no: 1,
          created_at: new Date(),
          is_notified: false,
          submissions: [{ problem_id: 'prob1' }],
        },
      ])

      // Mock getUniqueGroupNos response
      db.leetcoders.findMany.mockResolvedValueOnce([{ group_no: 1 }])

      // Mock getAllAssignedProblems response
      db.roadmap.findMany.mockResolvedValueOnce([
        { id: 'problem1', group_progress: [{ group_no: 1 }] },
        { id: 'problem2', group_progress: [{ group_no: 1 }] },
        { id: 'problem3', group_progress: [{ group_no: 1 }] },
        { id: 'problem4', group_progress: [{ group_no: 1 }] },
        { id: 'problem5', group_progress: [{ group_no: 1 }] },
        { id: 'problem6', group_progress: [{ group_no: 1 }] },
        { id: 'problem7', group_progress: [{ group_no: 1 }] },
        { id: 'problem8', group_progress: [{ group_no: 1 }] },
      ])

      // Mock updateIsNotified response
      db.leetcoders.update.mockResolvedValueOnce({ id: 'user1' })

      // Mock kickOffLeetcoders response
      db.$transaction.mockResolvedValueOnce([{ id: 'user1' }])

      // Act
      const req = mockRequest(env.API_SECRET)
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(NextResponse.json).toHaveBeenCalledWith({ success: true })
      expect(db.$disconnect).toHaveBeenCalled()
    })

    it('should handle errors properly', async () => {
      // Arrange
      db.leetcoders.findMany.mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      // Act
      const req = mockRequest(env.API_SECRET)
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({
        success: false,
        error: 'Internal Server Error',
      })
      expect(NextResponse.json).toHaveBeenCalledWith(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      )
      expect(db.$disconnect).toHaveBeenCalled()
    })
  })

  describe('getUniqueGroupNos', () => {
    it('should return unique group numbers', async () => {
      // Arrange
      const mockLeetcoders: LeetcoderWithSubmissions[] = [
        {
          id: 'user1',
          group_no: 1,
          created_at: new Date(),
          is_notified: false,
          submissions: [],
        },
        {
          id: 'user2',
          group_no: 2,
          created_at: new Date(),
          is_notified: false,
          submissions: [],
        },
      ]

      jest
        .spyOn(db.leetcoders, 'findMany')
        .mockResolvedValueOnce([{ group_no: 1 }, { group_no: 2 }] as { group_no: number }[])

      // Act
      const result = await getUniqueGroupNos(mockLeetcoders)

      // Assert
      expect(result).toEqual([1, 2])
      expect(db.leetcoders.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['user1', 'user2'] },
          status: 'APPROVED',
        },
        distinct: ['group_no'],
        select: { group_no: true },
      })
    })

    it('should handle errors properly', async () => {
      // Arrange
      const mockLeetcoders: LeetcoderWithSubmissions[] = [
        {
          id: 'user1',
          group_no: 1,
          created_at: new Date(),
          is_notified: false,
          submissions: [],
        },
      ]

      jest.spyOn(db.leetcoders, 'findMany').mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      // Act & Assert
      await expect(getUniqueGroupNos(mockLeetcoders)).rejects.toThrow('Database error')
    })
  })

  describe('kickOffLeetcoders', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks()
      jest.resetAllMocks()
    })

    it('should update leetcoder status to SUSPENDED and mark submissions as unsolved', async () => {
      // Arrange
      const mockLeetcoder = { id: 'user1', status: 'SUSPENDED' } as unknown as leetcoders

      // Reset and setup mock properly
      jest.spyOn(db, '$transaction').mockImplementation(() => {
        return Promise.resolve([mockLeetcoder])
      })

      // Act
      const result = await kickOffLeetcoders('user1')

      // Assert
      expect(result).toEqual(mockLeetcoder)
      expect(db.$transaction).toHaveBeenCalledWith([
        db.leetcoders.update({
          where: { id: 'user1' },
          data: { status: 'SUSPENDED' },
        }),
        db.submissions.updateMany({
          where: { user_id: 'user1' },
          data: { solved: false },
        }),
      ])
    })

    it('should handle errors properly', async () => {
      // Arrange - mock transaction to throw error
      jest.spyOn(db, '$transaction').mockImplementation(() => {
        throw new Error('Transaction error')
      })

      // Act & Assert
      await expect(kickOffLeetcoders('user1')).rejects.toThrow('Transaction error')
    })
  })

  describe('calculateUnsolvedProblems', () => {
    it('should return problems that are not in the solved list', () => {
      // Arrange
      const assignedProblems = [{ id: 'prob1' }, { id: 'prob2' }, { id: 'prob3' }]
      const solvedProblems = ['prob1', 'prob3']

      // Act
      const result = calculateUnsolvedProblems(assignedProblems, solvedProblems)

      // Assert
      expect(result).toEqual([{ id: 'prob2' }])
    })
  })

  describe('getSolvedProblems', () => {
    it('should extract problem IDs from submissions', () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
        submissions: [{ problem_id: 'prob1' }, { problem_id: 'prob2' }],
      }

      // Act
      const result = getSolvedProblems(leetcoder)

      // Assert
      expect(result).toEqual(['prob1', 'prob2'])
    })
  })

  describe('processLeetcoder', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks()
      jest.resetAllMocks()
    })

    it('should update notification status if threshold exceeded and not notified', async () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
        submissions: [{ problem_id: 'prob1' }],
      }
      const assignedProblems = Array(10)
        .fill(0)
        .map((_, i) => ({ id: `prob${i + 1}` }))
      jest.spyOn(db.leetcoders, 'update').mockResolvedValueOnce({ id: 'user1' } as leetcoders)

      // Act
      await processLeetcoder(leetcoder, assignedProblems)

      // Assert
      expect(db.leetcoders.update).toHaveBeenCalledWith({
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
        submissions: [{ problem_id: 'prob1' }],
      }
      const assignedProblems = Array(10)
        .fill(0)
        .map((_, i) => ({ id: `prob${i + 1}` }))

      // Setup transaction mock
      jest.spyOn(db, '$transaction').mockImplementation(() => {
        return Promise.resolve([{ id: 'user1', status: 'SUSPENDED' }])
      })

      // Act
      await processLeetcoder(leetcoder, assignedProblems)

      // Assert
      expect(db.$transaction).toHaveBeenCalled()
    })

    it('should not take action if assigned problems are below threshold', async () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
        submissions: [{ problem_id: 'prob1' }],
      }
      const assignedProblems = [{ id: 'prob1' }, { id: 'prob2' }]

      // Act
      await processLeetcoder(leetcoder, assignedProblems)

      // Assert
      expect(db.leetcoders.update).not.toHaveBeenCalled()
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it('should not take action if unsolved problems are below threshold', async () => {
      // Arrange
      const leetcoder: LeetcoderWithSubmissions = {
        id: 'user1',
        group_no: 1,
        created_at: new Date(),
        is_notified: false,
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
      await processLeetcoder(leetcoder, assignedProblems)

      // Assert
      expect(db.leetcoders.update).not.toHaveBeenCalled()
      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })
})
