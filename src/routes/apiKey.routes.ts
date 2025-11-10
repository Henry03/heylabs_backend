import { Router } from 'express';
import * as apiKeyController from '../controllers/apiKey.controller';
import { validateRequest } from '../middlewares/validateRequest.middleware';
import { createAPIKeyValidation, deleteAPIKeyValidation } from '../validations/apiKey.validation';
import { jwtAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create', jwtAuth(["admin", "user"]), createAPIKeyValidation, validateRequest, apiKeyController.createApiKey);
router.post('/', jwtAuth(["admin", "user"]), apiKeyController.getApiKey);
router.post('/delete', jwtAuth(["admin", "user"]), deleteAPIKeyValidation, validateRequest, apiKeyController.deleteApiKey);
router.post('/usage', jwtAuth(["admin", "user"]), apiKeyController.apiKeyUsage)
export default router;