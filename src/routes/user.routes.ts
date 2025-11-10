import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validateRequest } from '../middlewares/validateRequest.middleware';
import { createAPIKeyValidation } from '../validations/apiKey.validation';
import { jwtAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/list', jwtAuth(["admin"]), userController.listUser);

export default router;