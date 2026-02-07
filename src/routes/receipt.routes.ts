import { Router } from 'express';
import * as receiptController from '../controllers/receipt.controller';
import multer from 'multer';
import { errorResponse } from '../utils/response';
import { apiKeyAuth, universalAuth } from '../middlewares/auth.middleware';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadSingle = (field: string) => (req: any, res: any, next: any) => {
  upload.single(field)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return errorResponse(res, 400, "File size exceeds 10MB");
      }
      return errorResponse(res, 400, "Upload failed");
    } else if (err) {
      return errorResponse(res, 500, "Upload failed");
    }
    next();
  });
};

router.post('/scan', uploadSingle("image"), universalAuth(), receiptController.scan);

export default router;