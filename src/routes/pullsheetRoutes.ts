import { Router } from 'express';
import { importPullsheet } from '../controllers/pullsheetController.js';
import { getUnplacedItems, moveEquipment, placeGenericEquipment } from '../controllers/placedEquipmentController.js';

const router = Router();

router.post('/pullsheet/import', importPullsheet);
router.get('/jobs/:jobId/pullsheet-items/unplaced', getUnplacedItems);
router.post('/jobs/:jobId/pullsheet-items/place-generic', placeGenericEquipment);
router.patch('/jobs/:jobId/pullsheet-items/:id/move', moveEquipment);

export default router;
