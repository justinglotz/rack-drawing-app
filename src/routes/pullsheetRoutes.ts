import { Router } from 'express';
import { importPullsheet } from '../controllers/pullsheetController.js';
import { getUnplacedItems, moveEquipment, placeGenericEquipment, placePullsheetItem, updateEquipmentName, renameGlobal } from '../controllers/placedEquipmentController.js';

const router = Router();

router.post('/pullsheet/import', importPullsheet);
router.get('/jobs/:jobId/pullsheet-items/unplaced', getUnplacedItems);
router.post('/jobs/:jobId/pullsheet-items/place-generic', placeGenericEquipment);
router.patch('/jobs/:jobId/pullsheet-items/:itemId/place', placePullsheetItem);
router.patch('/jobs/:jobId/pullsheet-items/:id/display-name', updateEquipmentName);
router.patch('/jobs/:jobId/pullsheet-items/:id/catalog-name', renameGlobal);
router.patch('/jobs/:jobId/pullsheet-items/:id/move', moveEquipment);

export default router;
