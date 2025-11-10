import { Router } from 'express';
import * as mailController from '../controllers/mail.controller';

const router = Router();

router.post('/send', mailController.sendMail);

export default router;