import { type Request, type Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';
import { fetchFlexPullsheetData, fetchFlexPullsheetDates } from '../services/flexApiService.js';
import type { ParsedPullsheetItem } from '../services/flexParser.js';

export const importPullsheet = async (req: Request, res: Response) => {
  try {
    const { flexUrl } = req.body;

    if (!flexUrl) {
      return res.status(400).json({ error: 'flexUrl is required' });
    }

    // Extract pullsheet ID from Flex URL hash
    // Format: https://spectrum.flexrentalsolutions.com/f5/ui/#equipment-list-scan/{uuid}/prep
    let pullsheetId: string;
    try {
      const url = new URL(flexUrl);
      const hashParts = url.hash.split('/');
      // hashParts = ['#equipment-list-scan', '{uuid}', 'prep']

      if (!hashParts[1]) {
        return res.status(400).json({ error: 'Invalid Flex URL format' });
      }

      pullsheetId = hashParts[1];
    } catch {
      return res.status(400).json({ error: 'Invalid Flex URL format' });
    }

    // Check if pullsheet has already been imported
    const existingJob = await prisma.job.findUnique({
      where: { flexPullsheetId: pullsheetId }
    });

    if (existingJob) {
      return res.status(409).json({
        error: 'This pullsheet has already been imported',
        jobId: existingJob.id
      });
    }

    const parsedData = await fetchFlexPullsheetData(pullsheetId);

    // Best-effort — the pull sheet import shouldn't fail if Flex's key-info/
    // header-data calls error out or the fields aren't set on this job.
    let prepDate: Date | null = null;
    let leaveDate: Date | null = null;
    try {
      ({ prepDate, leaveDate } = await fetchFlexPullsheetDates(pullsheetId));
    } catch (error) {
      console.error('Failed to fetch prep/leave dates from Flex:', error);
    }

    // 1. Create Job
    let job;
    try {
      job = await prisma.job.create({
        data: {
          name: parsedData.job.name,
          flexPullsheetId: pullsheetId,
          prepDate,
          leaveDate,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const conflictingJob = await prisma.job.findUnique({
          where: { flexPullsheetId: pullsheetId },
        });
        return res.status(409).json({
          error: 'This pullsheet has already been imported',
          jobId: conflictingJob?.id ?? null,
        });
      }
      throw error;
    }

    // 2. Create RackDrawings in parallel
    const rackPromise = Promise.all(
      parsedData.rackDrawings.map(async (rack) => {
        const rackDrawing = await prisma.rackDrawing.create({
          data: {
            jobId: job.id,
            name: rack.name,
            totalSpaces: rack.totalSpaces,
            isDoubleWide: rack.isDoubleWide,
            flexSection: rack.flexSection,
            notes: rack.notes,
          },
        });
        return { name: rack.name, id: rackDrawing.id };
      })
    );

    const rackResults = await rackPromise;
    const rackIdMap = new Map(rackResults.map(r => [r.name, r.id]));

    // 3. Collect all equipment items (from racks and loose)
    const allEquipment: Array<ParsedPullsheetItem & { rackDrawingId: number | null }> = [];

    for (const rack of parsedData.rackDrawings) {
      const rackId = rackIdMap.get(rack.name)!;
      for (const item of rack.equipment) {
        allEquipment.push({ ...item, rackDrawingId: rackId });
      }
    }

    for (const item of parsedData.looseEquipment) {
      allEquipment.push({ ...item, rackDrawingId: null });
    }

    // 4. Upsert EquipmentCatalog entries efficiently
    const uniqueResourceIds = [...new Set(allEquipment.map(item => item.flexResourceId).filter(id => id !== null))];

    const existingCatalogItems = await prisma.equipmentCatalog.findMany({
      where: { flexResourceId: { in: uniqueResourceIds } },
      select: { flexResourceId: true, id: true }
    });

    const existingIdsSet = new Set(existingCatalogItems.map(c => c.flexResourceId));
    const missingItems = allEquipment.filter(item => !existingIdsSet.has(item.flexResourceId));

    // Deduplicate missing items by flexResourceId for insertion
    const uniqueMissingItemsMap = new Map();
    for (const item of missingItems) {
      if (!uniqueMissingItemsMap.has(item.flexResourceId)) {
        uniqueMissingItemsMap.set(item.flexResourceId, item);
      }
    }
    const nodesToInsert = Array.from(uniqueMissingItemsMap.values());

    if (nodesToInsert.length > 0) {
      await prisma.equipmentCatalog.createMany({
        data: nodesToInsert.map(item => ({
          flexResourceId: item.flexResourceId,
          name: item.name,
          displayName: item.name,
          rackUnits: item.rackUnits || null,
        })),
        skipDuplicates: true,
      });
    }
    // Re-fetch all catalog entries (including displayName)
    const finalCatalogItems = await prisma.equipmentCatalog.findMany({
      where: { flexResourceId: { in: uniqueResourceIds } },
      select: { flexResourceId: true, id: true, displayName: true }
    });

    const catalogIdMap = new Map(finalCatalogItems.map(c => [c.flexResourceId, c.id]));

    // 5. Create PullsheetItems — one record per physical unit (quantity=N → N records each with quantity=1)
    // Parents and children are created in two parallel waves so children can reference parent IDs.
    const parents = allEquipment.filter(item => item.parentflexResourceId === null);
    const children = allEquipment.filter(item => item.parentflexResourceId !== null);

    // Wave 1: create all parent units in parallel across items and within each item's quantity
    const parentResults = await Promise.all(
      parents.map(async (item) => {
        const baseData = {
          name: item.name,
          rackUnits: item.rackUnits,
          quantity: 1,
          flexResourceId: item.flexResourceId,
          flexSection: item.flexSection,
          notes: item.notes,
          displayNameOverride: null,
          job: { connect: { id: job.id } },
          ...(item.rackDrawingId ? { rackDrawing: { connect: { id: item.rackDrawingId } } } : {}),
          ...(item.flexResourceId && catalogIdMap.has(item.flexResourceId)
            ? { equipmentCatalog: { connect: { flexResourceId: item.flexResourceId } } }
            : {}),
        };

        const units = await Promise.all(
          Array.from({ length: item.quantity }, () => prisma.pullsheetItem.create({ data: baseData }))
        );
        // Use the minimum id as the stable representative for child linking
        const representativeId = Math.min(...units.map(u => u.id));
        return { flexResourceId: item.flexResourceId, representativeId, count: units.length };
      })
    );

    // Maps flexResourceId → representative id used to link children
    const parentFirstIdMap = new Map(parentResults.map(r => [r.flexResourceId, r.representativeId]));
    const totalParents = parentResults.reduce((sum, r) => sum + r.count, 0);

    // Wave 2: create all child units in parallel (parent IDs are now known)
    let totalChildren = 0;
    if (children.length > 0) {
      const childCounts = await Promise.all(
        children.map(async (item) => {
          const parentId = parentFirstIdMap.get(item.parentflexResourceId!);
          const baseData = {
            name: item.name,
            rackUnits: item.rackUnits,
            quantity: 1,
            flexResourceId: item.flexResourceId,
            flexSection: item.flexSection,
            notes: item.notes,
            displayNameOverride: null,
            job: { connect: { id: job.id } },
            ...(item.rackDrawingId ? { rackDrawing: { connect: { id: item.rackDrawingId } } } : {}),
            ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
            ...(item.flexResourceId && catalogIdMap.has(item.flexResourceId)
              ? { equipmentCatalog: { connect: { flexResourceId: item.flexResourceId } } }
              : {}),
          };

          const units = await Promise.all(
            Array.from({ length: item.quantity }, () => prisma.pullsheetItem.create({ data: baseData }))
          );
          return units.length;
        })
      );
      totalChildren = childCounts.reduce((sum, c) => sum + c, 0);
    }

    res.status(201).json({
      data: job,
      metadata: {
        rackDrawingsCreated: parsedData.rackDrawings.length,
        pullsheetItemsCreated: totalParents + totalChildren,
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import pullsheet' });
  }
}
