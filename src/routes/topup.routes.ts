import { Router } from 'express';
import * as topupController from '../controllers/topup.controller';
import { validateRequest } from '../middlewares/validateRequest.middleware';
import { jwtAuth } from '../middlewares/auth.middleware';
import { cancelTopupValidation, topupValidation } from '../validations/topup.validation';

const router = Router();

router.post('/', jwtAuth(["admin"]), topupValidation, validateRequest, topupController.topUp);
router.post('/cancel', jwtAuth(["admin"]), cancelTopupValidation, validateRequest, topupController.cancel);

export default router;