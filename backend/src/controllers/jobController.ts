import { type Request, type Response} from 'express';
import { prisma } from '../config/prisma.js';

const INVALID_DATE = Symbol('invalid-date');

// Parses a nullable date field from a PATCH body: undefined (field omitted,
// leave unchanged), null (clear it), or a valid date string.
function parseNullableDate(value: unknown): Date | null | undefined | typeof INVALID_DATE {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return INVALID_DATE;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? INVALID_DATE : d;
}

// Get all jobs, each with a lightweight summary of its rack drawings
export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        rackDrawings: {
          select: {
            id: true,
            name: true,
            totalSpaces: true,
            isDoubleWide: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
}

// Get a specific job by ID
export const getJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jobId = Number(id);

    if (!Number.isInteger(jobId)) {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
}

// Create job
export const createJob = async (req: Request, res: Response) => {
  try {
    const { name, flexPullsheetId, description } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedFlexPullsheetId = typeof flexPullsheetId === 'string' ? flexPullsheetId.trim() : '';

    if (!normalizedName || !normalizedFlexPullsheetId) {
      res.status(400).json({ error: 'Name and flexPullsheetId are required' });
      return;
    }

    const newJob = await prisma.job.create({
      data: {
        name: normalizedName,
        flexPullsheetId: normalizedFlexPullsheetId,
        ...(description && { description }),
      },
    });

    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
}

// Edit job
export const editJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, prepDate, leaveDate } = req.body;
    const jobId = Number(id);

    if (!Number.isInteger(jobId)) {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    if (!name && description === undefined && prepDate === undefined && leaveDate === undefined) {
      res.status(400).json({ error: 'At least one field (name, description, prepDate, or leaveDate) is required' });
      return;
    }

    const parsedPrepDate = parseNullableDate(prepDate);
    if (parsedPrepDate === INVALID_DATE) {
      res.status(400).json({ error: 'prepDate must be a valid date string or null' });
      return;
    }

    const parsedLeaveDate = parseNullableDate(leaveDate);
    if (parsedLeaveDate === INVALID_DATE) {
      res.status(400).json({ error: 'leaveDate must be a valid date string or null' });
      return;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parsedPrepDate !== undefined && { prepDate: parsedPrepDate }),
        ...(parsedLeaveDate !== undefined && { leaveDate: parsedLeaveDate }),
      },
    });

    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job' });
  }
}

// Delete job
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jobId = Number(id);
    if (!Number.isInteger(jobId)) {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
}
