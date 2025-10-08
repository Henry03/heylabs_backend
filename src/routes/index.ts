import { Router } from 'express';

import ktpRoutes from './ktp.routes';

const router = Router();

router.use('/ktp', ktpRoutes);

export default router;