import sharp from "sharp";
import logger from "../utils/logger";
import { GoogleGenAI } from "@google/genai";
import { ScanInput } from "../interfaces/receipt.interface";

export async function scanWithGemini({buffer, prompt, mimeType = "image/jpeg"}: ScanInput): Promise<string> {
    const client = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY?.trim()
    });

    logger.info("Starting Scan Image With Gemini...");

    const processedBuffer = await sharp(buffer)
        .resize({ width: 1024 })
        .grayscale()
        .sharpen()
        .toBuffer();

    const base64Image = processedBuffer.toString("base64");
    logger.debug("Image converted to base64");

    const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            {
                role: "user",
                parts: [
                    {text: prompt},
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }
        ]
    });

    const raw = response?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    logger.debug(`Raw Gemini response: ${raw}`);

    return raw;
}