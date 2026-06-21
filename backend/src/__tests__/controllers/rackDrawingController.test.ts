import { jest } from '@jest/globals'
import type { Request, Response } from 'express'

// --- Mock Prisma ---
const mockPrisma = {
  rackDrawing: {
    findFirst: jest.fn<any>(),
    update: jest.fn<any>(),
  },
}

jest.unstable_mockModule('../../config/prisma.js', () => ({
  prisma: mockPrisma,
}))

// --- Helpers ---

function makeReq(body: Record<string, unknown> = {}, params: Record<string, any> = {}): Request {
  return { body, params } as unknown as Request
}

function makeRes(): Response & { _status: number; _json: unknown; _sent: boolean } {
  const res = {
    _status: 200,
    _json: null as unknown,
    _sent: false,
    status(code: number) {
      res._status = code
      return res
    },
    json(data: unknown) {
      res._json = data
      return res
    },
    send() {
      res._sent = true
      return res
    },
  }
  return res as unknown as Response & { _status: number; _json: unknown; _sent: boolean }
}

// --- Dynamic import after mocks are registered ---
const { updateRackDrawingName } = await import('../../controllers/rackDrawingController.js')

// --- Tests ---

describe('Rack Drawing Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('updateRackDrawingName', () => {
    it('returns 400 when jobId is non-integer', async () => {
      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: 'abc', rackId: '1' }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Invalid job ID or rack ID' })
      expect(mockPrisma.rackDrawing.findFirst).not.toHaveBeenCalled()
    })

    it('returns 400 when rackId is non-integer', async () => {
      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: '1', rackId: 'xyz' }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Invalid job ID or rack ID' })
      expect(mockPrisma.rackDrawing.findFirst).not.toHaveBeenCalled()
    })

    it('returns 400 when both jobId and rackId are non-integer', async () => {
      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: 'abc', rackId: 'xyz' }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Invalid job ID or rack ID' })
      expect(mockPrisma.rackDrawing.findFirst).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
      const res = makeRes()
      await updateRackDrawingName(makeReq({}, { jobId: '1', rackId: '1' }), res)

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'name is required and must be a non-empty string' })
      expect(mockPrisma.rackDrawing.findFirst).not.toHaveBeenCalled()
    })

    it('returns 400 when name is whitespace-only', async () => {
      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: '   ' }, { jobId: '1', rackId: '1' }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'name is required and must be a non-empty string' })
      expect(mockPrisma.rackDrawing.findFirst).not.toHaveBeenCalled()
    })

    it('returns 400 when name is not a string', async () => {
      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 123 }, { jobId: '1', rackId: '1' }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'name is required and must be a non-empty string' })
      expect(mockPrisma.rackDrawing.findFirst).not.toHaveBeenCalled()
    })

    it('returns 404 when rack not found', async () => {
      mockPrisma.rackDrawing.findFirst.mockResolvedValue(null)

      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: '1', rackId: '999' }),
        res,
      )

      expect(res._status).toBe(404)
      expect(res._json).toEqual({ error: 'Rack drawing not found' })
      expect(mockPrisma.rackDrawing.findFirst).toHaveBeenCalledWith({
        where: { id: 999, jobId: 1 },
      })
      expect(mockPrisma.rackDrawing.update).not.toHaveBeenCalled()
    })

    it('returns 404 when rack belongs to different job', async () => {
      mockPrisma.rackDrawing.findFirst.mockResolvedValue(null)

      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: '1', rackId: '5' }),
        res,
      )

      expect(res._status).toBe(404)
      expect(res._json).toEqual({ error: 'Rack drawing not found' })
      expect(mockPrisma.rackDrawing.findFirst).toHaveBeenCalledWith({
        where: { id: 5, jobId: 1 },
      })
    })

    it('successfully updates rack drawing name', async () => {
      const existingRack = {
        id: 1,
        jobId: 1,
        name: 'Old Name',
        totalSpaces: 42,
        isDoubleWide: false,
        flexSection: 'A',
        displayOrder: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const updatedRack = {
        ...existingRack,
        name: 'New Name',
        updatedAt: new Date(),
      }

      mockPrisma.rackDrawing.findFirst.mockResolvedValue(existingRack)
      mockPrisma.rackDrawing.update.mockResolvedValue(updatedRack)

      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: '1', rackId: '1' }),
        res,
      )

      expect(res._status).toBe(200)
      expect(res._json).toEqual(updatedRack)
      expect(mockPrisma.rackDrawing.findFirst).toHaveBeenCalledWith({
        where: { id: 1, jobId: 1 },
      })
      expect(mockPrisma.rackDrawing.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      })
    })

    it('trims whitespace from name before updating', async () => {
      const existingRack = {
        id: 1,
        jobId: 1,
        name: 'Old Name',
        totalSpaces: 42,
        isDoubleWide: false,
        flexSection: 'A',
        displayOrder: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const updatedRack = {
        ...existingRack,
        name: 'Trimmed Name',
      }

      mockPrisma.rackDrawing.findFirst.mockResolvedValue(existingRack)
      mockPrisma.rackDrawing.update.mockResolvedValue(updatedRack)

      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: '  Trimmed Name  ' }, { jobId: '1', rackId: '1' }),
        res,
      )

      expect(res._status).toBe(200)
      expect(mockPrisma.rackDrawing.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Trimmed Name' },
      })
    })

    it('returns 500 on database error', async () => {
      mockPrisma.rackDrawing.findFirst.mockRejectedValue(new Error('Database error'))

      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: '1', rackId: '1' }),
        res,
      )

      expect(res._status).toBe(500)
      expect(res._json).toEqual({ error: 'Failed to update rack drawing' })
    })

    it('returns 500 when update fails', async () => {
      const existingRack = {
        id: 1,
        jobId: 1,
        name: 'Old Name',
        totalSpaces: 42,
        isDoubleWide: false,
        flexSection: 'A',
        displayOrder: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.rackDrawing.findFirst.mockResolvedValue(existingRack)
      mockPrisma.rackDrawing.update.mockRejectedValue(new Error('Update failed'))

      const res = makeRes()
      await updateRackDrawingName(
        makeReq({ name: 'New Name' }, { jobId: '1', rackId: '1' }),
        res,
      )

      expect(res._status).toBe(500)
      expect(res._json).toEqual({ error: 'Failed to update rack drawing' })
    })
  })
})
