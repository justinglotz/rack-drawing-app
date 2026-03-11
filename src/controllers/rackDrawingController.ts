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
