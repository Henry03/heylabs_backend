import { Router } from 'express';
import * as webhook from '../controllers/telegram.webhook.controller';

const router = Router();

router.post(('/webhook'), webhook.TelegramWebhook);

export default router;