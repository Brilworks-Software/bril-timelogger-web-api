import { Router } from 'express';
import { generateInactivityLog, generateUserActivityExport } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Report routes
router.get('/inactivity-log', authenticateToken, generateInactivityLog);
router.get('/user-activity-export', authenticateToken, generateUserActivityExport);

export default router; 