import { Router } from 'express';
import * as ktpController from '../controllers/ktp.controller';
import multer from 'multer';
import { errorResponse } from '../utils/response';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
});

const uploadSingle = (field: string) => (req: any, res: any, next: any) => {
  upload.single(field)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return errorResponse(res, 400, "File size exceeds 1MB");
      }
      return errorResponse(res, 400, "Upload failed");
    } else if (err) {
      return errorResponse(res, 500, "Upload failed");
    }
    next();
  });
};


router.post('/ocr', uploadSingle("image"), ktpController.ocrKtp);

export default router;