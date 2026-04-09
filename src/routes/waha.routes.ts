import { Router } from 'express';
import * as waybill from '../controllers/waha/webhook.controller';

const router = Router();

router.post(('/webhook'), waybill.wahaWebhook);

export default router;