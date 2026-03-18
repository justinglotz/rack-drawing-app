import { Router } from 'express';
import { getJobs, getJob, createJob, editJob, deleteJob } from '../controllers/jobController.js';
import { getRackDrawingsForJob, updateRackDrawingName } from '../controllers/rackDrawingController.js';

const router = Router();

router.get('/jobs', getJobs);
router.post('/jobs', createJob);
router.get('/jobs/:id', getJob);
router.patch('/jobs/:id', editJob);
router.delete('/jobs/:id', deleteJob);
router.get('/jobs/:jobId/rack-drawings', getRackDrawingsForJob);
router.patch('/jobs/:jobId/rack-drawings/:rackId', updateRackDrawingName);

export default router;
