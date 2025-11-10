import { Router } from 'express';
import * as mailController from '../controllers/mail.controller';
import multer from 'multer';
import { errorResponse } from '../utils/response';
import { apiKeyAuth } from '../middlewares/apiKeyAuth';

const router = Router();

router.post('/send', mailController.sendMail);

export default router;