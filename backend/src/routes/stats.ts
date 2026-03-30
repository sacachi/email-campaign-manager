import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getDashboardStats } from '../controllers/stats.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', getDashboardStats);

export default router;
