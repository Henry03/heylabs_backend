import { Request, Response } from "express";
import { scanWithGemini } from "../services/gemini.service";
import { errorResponse, response } from "../utils/response";
import logger from "../utils/logger";
import { cleanJsonResponse } from "../utils/file";
import { ReceiptResult } from "../interfaces/receipt.interface";
import { compressImage } from "../utils/image";

export const scan = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      logger.warn("No file uploaded in Receipt Scan endpoint");
      return errorResponse(res, 400, "No file uploaded");
    }

    const file = req.file;

    const compressedBuffer = await compressImage(
      file.buffer,
      file.mimetype,
      300*1024 // 300KB
    );

    const prompt = `Kamu adalah sistem OCR dan data extraction profesional untuk struk belanja.

    Tugas:
    - Analisis gambar struk / receipt yang di-upload (jenis apa pun).
    - Ekstrak seluruh informasi transaksi, termasuk DISKON PER BARANG jika ada.
    - Return HASIL AKHIR hanya dalam format JSON VALID.
    - Jangan menambahkan penjelasan atau teks apa pun di luar JSON.

    Aturan:
    1. Jangan mengarang data.
    2. Gunakan null jika data tidak ditemukan.
    3. Semua nominal angka tanpa simbol mata uang.
    4. Diskon bernilai POSITIF (contoh: 2000 berarti potongan 2000).
    5. Harga "unit_price" adalah harga SEBELUM diskon.
    6. "total_price" adalah harga SETELAH diskon.
    7. Gunakan ISO 8601 untuk tanggal jika memungkinkan.

    Aturan total_includes_tax:

    1. Jika struk menyebut "Total termasuk pajak" → true
    2. Jika tax baris ada DAN total ≈ subtotal - discount → true
    3. Jika total ≈ subtotal - discount + tax → false
    4. Jika ambigu → null

    Aturan Payment Details:
    1. Jika struk menunjukkan lebih dari satu metode pembayaran (contoh: cash + voucher),
      maka WAJIB memisahkan masing-masing ke dalam array payment_details.
    2. payment_details adalah array object:
      {
        "method": "cash" | "credit_card" | "debit_card" | "voucher" | "ewallet" | "transfer" | "other",
        "provider": string | null,
        "amount": number
      }
    3. Jika voucher / promo / gift card digunakan sebagai alat bayar,
      MASUKKAN ke payment_details dengan method = "voucher",
      DAN nominalnya JANGAN dimasukkan ke paid.
    4. Jika pembayaran hanya 1 metode,
      tetap gunakan array dengan 1 item.
    5. Jangan menggabungkan metode pembayaran menjadi satu string.


    Struktur JSON WAJIB:

    {
      "valid_receipt": true|false,
      "merchant": {
        "name": string | null,
        "address": string | null,
        "phone": string | null
      },
      "transaction": {
        "receipt_number": string | null,
        "date": string | null,
        "time": string | null,
        "payment_details": [
          {
            "method": string,
            "provider": string | null,
            "amount": number
          }
        ]
      },
      "items": [
        {
          "name": string,
          "quantity": number | null,
          "unit_price": number | null,
          "discount": number | null,
          "total_price": number | null
        }
      ],
      "summary": {
        "subtotal": number | null,
        "total_item_discount": number | null,
        "tax": number | null,
        "service_charge": number | null,
        "discount": number | null,
        "total": number | null,
        "paid": number | null,
        "change": number | null,
        "total_includes_tax": true | false | null
      },
      "currency": string | null
    }
    `

    const result = await scanWithGemini({
      buffer: compressedBuffer, 
      prompt, 
      mimeType: file.mimetype});
      
    const textResult = cleanJsonResponse(result ?? "");
    console.log(result)

    let jsonResult: ReceiptResult | any;
    try {
        const parsed = JSON.parse(textResult);
        logger.info("Receipt data successfully parsed");
        jsonResult = parsed;
        
        logger.info("Receipt scanned successfully");

        const { valid_receipt, ...receipt_data } = jsonResult;

        if(valid_receipt == false){
          logger.info("Uploaded image is not a valid Receipt");
          return errorResponse(res, 400, "Uploaded image is not a valid Receipt")
        }

        return response(res, true, 200, "Receipt scanned successfully", receipt_data);
    } catch (err: any) {
      logger.error(`Failed to parse JSON: ${err.message}`);
      jsonResult = {
        "merchant": {
          "name": null,
          "address": null,
          "phone": null
        },
        "transaction": {
          "receipt_number": null,
          "date": null,
          "time": null,
          "payment_method": null
        },
        "items": [],
        "summary": {
          "subtotal": null,
          "total_item_discount": null,
          "tax": null,
          "service_charge": null,
          "discount": null,
          "total": null,
          "paid": null,
          "change": null,
          "total_includes_tax": null
        },
        "currency": null
      };

        logger.info("Scan receipt failed");

        return response(res, true, 500, "Scan receipt failed", jsonResult);
    }

  } catch (err: any) {
    logger.error(`Scan receipt failed: ${err.message}`);
    return errorResponse(res, 500, "Scan receipt failed");
  }
};
