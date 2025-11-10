import { Request, Response } from "express";
import { processKtpImage } from "../services/ocr.service";
import { errorResponse, response } from "../utils/response";
import logger from "../utils/logger";
import { transporter } from "../utils/mailer";

export const sendMail = async (req: Request, res: Response) => {
  try {
    const info = await transporter.sendMail({
        from: '"HeyLabs" <no-reply@heylabs.id>',
        to: "test-2fhwu8a1z@srv1.mail-tester.com",
        subject: "Test",
        text: "test"
    })

    console.log("Message sent:", info.messageId)
    return response(res, true, 200, "Email sended successfully");
  } catch (err: any) {
    logger.error(`OCR processing failed: ${err.message}`);
    return errorResponse(res, 500, "OCR processing failed");
  }
};
