import { Router } from 'express';
import { getUsageStats } from '../controllers/energyController';
import { validateUser } from '../middleware/validateUser';

const router = Router();

// Get energy usage statistics
// Protected route - requires authentication
router.get('/usage', validateUser, getUsageStats);

export default router;
