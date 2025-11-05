import { Router } from 'express';

import { healthRouter } from '@/routers/health.route';
import { mediaRouter } from '@/routers/media.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/media', mediaRouter);

export default router;
