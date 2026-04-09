import { Router } from 'express';

import authRoutes from './auth.routes';
import ktpRoutes from './ktp.routes';
import mailRoutes from './mail.routes';
import apiKeyRoutes from './apiKey.routes';
import endpointRoutes from './endpoint.routes';
import topupRoutes from './topup.routes';
import profileRoutes from './profile.routes';
import userRoutes from './user.routes';
import receiptRoutes from './receipt.routes';
import wahaRoutes from './waha.routes';

const router = Router();

router.use('/auth', authRoutes)
router.use('/ktp', ktpRoutes);
router.use('/mail', mailRoutes);
router.use('/api-key', apiKeyRoutes);
router.use('/endpoint', endpointRoutes);
router.use('/topup', topupRoutes);
router.use('/profile', profileRoutes)
router.use('/user', userRoutes)
router.use('/receipt', receiptRoutes)
router.use('/wa', wahaRoutes)

export default router;