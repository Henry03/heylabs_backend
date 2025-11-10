import { Router } from 'express';
import * as endpointController from '../controllers/endpoint.controller';
import { validateRequest } from '../middlewares/validateRequest.middleware';
import { jwtAuth } from '../middlewares/auth.middleware';
import { createEndpointValidation, deleteEndpointValidation, detailEndpointValidation, updateEndpointValidation } from '../validations/endpoint.validation';

const router = Router();

router.post('/create', jwtAuth(["admin"]), createEndpointValidation, validateRequest, endpointController.create);
router.put('/update', jwtAuth(["admin"]), updateEndpointValidation, validateRequest, endpointController.update);
router.post('/delete', jwtAuth(["admin"]), deleteEndpointValidation, validateRequest, endpointController.destroy);
router.post('/detail', jwtAuth(["admin", "user"]), detailEndpointValidation, validateRequest, endpointController.detail);
router.get('/', jwtAuth(["admin", "user"]), endpointController.list);

export default router;