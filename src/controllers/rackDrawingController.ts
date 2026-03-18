import { type Request, type Response} from 'express';
import { prisma } from '../config/prisma.js';

export const getRackDrawings = async (req: Request, res: Response) => {
  try {
    const rackDrawings = await prisma.rackDrawing.findMany();
    res.status(200).json(rackDrawings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rack drawings' });
  }
}

export const getRackDrawingsForJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const id = Number(jobId);

    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Get all rack drawings with their placed items
    const rackDrawings = await prisma.rackDrawing.findMany({
      where: { jobId: id },
      include: {
        pullsheetItems: {
          select: {
            id: true,
            name: true,
            displayNameOverride: true,
            rackUnits: true,
            side: true,
            startPosition: true,
            genericEquipment: {
              select: { category: true },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Transform response to include category field
    const formattedRackDrawings = rackDrawings.map((rack) => ({
      id: rack.id,
      jobId: rack.jobId,
      name: rack.name,
      totalSpaces: rack.totalSpaces,
      isDoubleWide: rack.isDoubleWide,
      flexSection: rack.flexSection,
      displayOrder: rack.displayOrder,
      notes: rack.notes,
      createdAt: rack.createdAt,
      updatedAt: rack.updatedAt,
      placedItems: rack.pullsheetItems.map((item) => ({
        id: item.id,
        name: item.name,
        displayNameOverride: item.displayNameOverride,
        rackUnits: item.rackUnits,
        side: item.side,
        startPosition: item.startPosition,
        category: item.genericEquipment?.category || null,
      })),
    }));

    res.status(200).json(formattedRackDrawings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rack drawings' });
  }
}

export const updateRackDrawingName = async (req: Request, res: Response): Promise<void> => {
  const jobId = Number(req.params.jobId);
  const rackId = Number(req.params.rackId);

  if (!Number.isInteger(jobId) || !Number.isInteger(rackId)) {
    res.status(400).json({ error: 'Invalid job ID or rack ID' });
    return;
  }

  const { name } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required and must be a non-empty string' });
    return;
  }

  try {
    // Verify rack exists and belongs to the job
    const rack = await prisma.rackDrawing.findFirst({
      where: { id: rackId, jobId },
    });
    if (!rack) {
      res.status(404).json({ error: 'Rack drawing not found' });
      return;
    }

    const updated = await prisma.rackDrawing.update({
      where: { id: rackId },
      data: { name: name.trim() },
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rack drawing' });
  }
}

export const deleteRackDrawing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rackDrawingId = Number(id)

    if (!Number.isInteger(rackDrawingId)) {
      res.status(400).json({ error: 'Invalid rack drawing ID' });
      return;
    }

    // Clear all placement data for equipment in this rack
    await prisma.$transaction([
      prisma.pullsheetItem.updateMany({
        where: { rackDrawingId },
        data: {
          rackDrawingId: null,
          side: null,
          startPosition: null,
        }
      }),
      prisma.rackDrawing.delete({
        where: { id: rackDrawingId }
      })
    ])

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete rack drawing' });
  }
}
