import { jest } from '@jest/globals'
import type { Request, Response } from 'express'

// --- Mock Prisma ---
const mockPrisma = {
  genericEquipment: {
    findMany: jest.fn<any>(),
    create: jest.fn<any>(),
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
const { getGenericEquipment, createGenericEquipment } = await import(
  '../../controllers/genericEquipmentController.js'
)

// --- Tests ---

describe('Generic Equipment Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('getGenericEquipment', () => {
    it('returns 200 with all active equipment', async () => {
      const mockEquipment = [
        {
          id: 1,
          name: 'Vent Door Small',
          displayName: 'Vent Door - Small',
          category: 'Vent Doors',
          rackUnits: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Vent Door Large',
          displayName: 'Vent Door - Large',
          category: 'Vent Doors',
          rackUnits: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockPrisma.genericEquipment.findMany.mockResolvedValue(mockEquipment)

      const res = makeRes()
      await getGenericEquipment(makeReq(), res)

      expect(res._status).toBe(200)
      expect(res._json).toEqual(mockEquipment)
      expect(mockPrisma.genericEquipment.findMany).toHaveBeenCalled()
    })

    it('only returns items where isActive is true', async () => {
      const mockEquipment = [
        {
          id: 1,
          name: 'Active Equipment',
          displayName: 'Active',
          category: 'Test',
          rackUnits: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockPrisma.genericEquipment.findMany.mockResolvedValue(mockEquipment)

      const res = makeRes()
      await getGenericEquipment(makeReq(), res)

      expect(mockPrisma.genericEquipment.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    })

    it('returns results ordered by category then name', async () => {
      const mockEquipment = [
        {
          id: 3,
          name: 'Blank Panel Small',
          displayName: 'Blank Panel - Small',
          category: 'Blank Panels',
          rackUnits: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          name: 'Blank Panel Large',
          displayName: 'Blank Panel - Large',
          category: 'Blank Panels',
          rackUnits: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 1,
          name: 'Vent Door Small',
          displayName: 'Vent Door - Small',
          category: 'Vent Doors',
          rackUnits: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockPrisma.genericEquipment.findMany.mockResolvedValue(mockEquipment)

      const res = makeRes()
      await getGenericEquipment(makeReq(), res)

      // Verify the endpoint returned the data in the order provided
      expect(res._json).toEqual(mockEquipment)
      // Verify the correct orderBy was used
      expect(mockPrisma.genericEquipment.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    })

    it('returns empty array when no active equipment exists', async () => {
      mockPrisma.genericEquipment.findMany.mockResolvedValue([])

      const res = makeRes()
      await getGenericEquipment(makeReq(), res)

      expect(res._status).toBe(200)
      expect(res._json).toEqual([])
    })

    it('returns 500 on database error', async () => {
      mockPrisma.genericEquipment.findMany.mockRejectedValue(new Error('Database error'))

      const res = makeRes()
      await getGenericEquipment(makeReq(), res)

      expect(res._status).toBe(500)
      expect(res._json).toEqual({ error: 'Failed to fetch generic equipment' })
    })
  })

  describe('createGenericEquipment', () => {
    it('creates equipment with all fields (name, displayName, category, rackUnits)', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Vent Door Small',
        displayName: 'Vent Door - Small',
        category: 'Vent Doors',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Vent Door Small',
          displayName: 'Vent Door - Small',
          category: 'Vent Doors',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(201)
      expect(res._json).toEqual(createdEquipment)
      expect(mockPrisma.genericEquipment.create).toHaveBeenCalledWith({
        data: {
          name: 'Vent Door Small',
          displayName: 'Vent Door - Small',
          category: 'Vent Doors',
          rackUnits: 1,
        },
      })
    })

    it('creates equipment without displayName (displayName should be null)', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Blank Panel',
        displayName: null,
        category: 'Blank Panels',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Blank Panel',
          category: 'Blank Panels',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(201)
      expect(res._json).toEqual(createdEquipment)
      expect(mockPrisma.genericEquipment.create).toHaveBeenCalledWith({
        data: {
          name: 'Blank Panel',
          displayName: null,
          category: 'Blank Panels',
          rackUnits: 1,
        },
      })
    })

    it('returns 201 status code', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Test Equipment',
        displayName: null,
        category: 'Test',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(201)
    })

    it('response includes id and timestamps (createdAt, updatedAt)', async () => {
      const now = new Date()
      const createdEquipment = {
        id: 42,
        name: 'Test Equipment',
        displayName: null,
        category: 'Test',
        rackUnits: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._json).toHaveProperty('id')
      expect(res._json).toHaveProperty('createdAt')
      expect(res._json).toHaveProperty('updatedAt')
      expect((res._json as any).id).toBe(42)
    })

    it('response includes isActive = true by default', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Test Equipment',
        displayName: null,
        category: 'Test',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect((res._json as any).isActive).toBe(true)
    })

    // Input Validation - Required Fields
    it('rejects missing name with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'name is required and must be a non-empty string' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects non-string name with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 123,
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'name is required and must be a non-empty string' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects whitespace-only name (after trim) with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: '   ',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'name is required and must be a non-empty string' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects missing category with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'category is required and must be a non-empty string' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects non-string category with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 123,
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'category is required and must be a non-empty string' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects whitespace-only category (after trim) with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: '   ',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'category is required and must be a non-empty string' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects missing rackUnits with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'rackUnits is required and must be a positive integer' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects non-integer rackUnits with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: 1.5,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'rackUnits is required and must be a positive integer' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects zero rackUnits with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: 0,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'rackUnits is required and must be a positive integer' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    it('rejects negative rackUnits with 400 error', async () => {
      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: -1,
        }),
        res,
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'rackUnits is required and must be a positive integer' })
      expect(mockPrisma.genericEquipment.create).not.toHaveBeenCalled()
    })

    // Input Validation - Optional Fields
    it('accepts missing displayName (optional)', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Test Equipment',
        displayName: null,
        category: 'Test',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(201)
      expect(mockPrisma.genericEquipment.create).toHaveBeenCalled()
    })

    it('trims whitespace from name', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Test Equipment',
        displayName: null,
        category: 'Test',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: '  Test Equipment  ',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(mockPrisma.genericEquipment.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Equipment',
          displayName: null,
          category: 'Test',
          rackUnits: 1,
        },
      })
    })

    it('trims whitespace from category', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Test Equipment',
        displayName: null,
        category: 'Test',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: '  Test  ',
          rackUnits: 1,
        }),
        res,
      )

      expect(mockPrisma.genericEquipment.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Equipment',
          displayName: null,
          category: 'Test',
          rackUnits: 1,
        },
      })
    })

    it('trims whitespace from displayName', async () => {
      const createdEquipment = {
        id: 1,
        name: 'Test Equipment',
        displayName: 'Display Name',
        category: 'Test',
        rackUnits: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.genericEquipment.create.mockResolvedValue(createdEquipment)

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          displayName: '  Display Name  ',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(mockPrisma.genericEquipment.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Equipment',
          displayName: 'Display Name',
          category: 'Test',
          rackUnits: 1,
        },
      })
    })

    // Constraints
    it('rejects duplicate equipment names (unique constraint)', async () => {
      mockPrisma.genericEquipment.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`name`)'),
      )

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Existing Equipment',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(500)
      expect(res._json).toEqual({ error: 'Failed to create generic equipment' })
    })

    // Error Handling
    it('database error returns 500 with generic message', async () => {
      mockPrisma.genericEquipment.create.mockRejectedValue(new Error('Database error'))

      const res = makeRes()
      await createGenericEquipment(
        makeReq({
          name: 'Test Equipment',
          category: 'Test',
          rackUnits: 1,
        }),
        res,
      )

      expect(res._status).toBe(500)
      expect(res._json).toEqual({ error: 'Failed to create generic equipment' })
    })
  })
})
