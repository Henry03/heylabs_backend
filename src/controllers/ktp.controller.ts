import { Request, Response } from "express";
import { processKtpImage } from "../services/ocr.service";
import { errorResponse, response } from "../utils/response";
import logger from "../utils/logger";

export const ocrKtp = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      logger.warn("No file uploaded in OCR endpoint");
      return errorResponse(res, 400, "No file uploaded");
    }

    const result = await processKtpImage(req.file.buffer);

    if(result.is_ktp == false){
      logger.info("Uploaded image is not a valid KTP");
      return errorResponse(res, 400, "Uploaded image is not a valid KTP")
    }

    const { is_ktp, ...ktpData } = result;
    logger.info("KTP processed successfully");

    return response(res, true, 200, "KTP processed successfully", ktpData);
  } catch (err: any) {
    logger.error(`OCR processing failed: ${err.message}`);
    return errorResponse(res, 500, "OCR processing failed");
  }
};
