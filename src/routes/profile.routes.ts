import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { jwtAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', jwtAuth(["admin", "user"]), profileController.profile);

export default router;