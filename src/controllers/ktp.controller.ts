import { Request, Response } from "express";
import { processKtpImage } from "../services/ocr.service";
import { errorResponse, response } from "../utils/response";

export const ocrKtp = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await processKtpImage(req.file.buffer);

    if(result.is_ktp == false){
      return errorResponse(res, 400, "Uploaded image is not a valid KTP")
    }

    const { is_ktp, ...ktpData } = result;

    return response(res, true, 200, "KTP processed successfully", ktpData);
  } catch (err: any) {
    console.error(err);
    return errorResponse(res, 500, "OCR processing failed");
  }
};
