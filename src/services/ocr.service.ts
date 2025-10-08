import sharp from "sharp";
import { cleanJsonResponse, normalizeKtpData } from "../utils/file";
import { KtpData } from "../interfaces/ktp.interface";
import OpenAI from "openai";

export async function processKtpImage(buffer: Buffer): Promise<KtpData | any> {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY?.trim(),
    });

    const processedBuffer = await sharp(buffer)
        .resize({ width: 1024 })
        .grayscale()
        .sharpen()
        .toBuffer();

    const base64Image = processedBuffer.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    const prompt = `
        You are given an image of an Indonesian KTP. Return ONLY valid JSON, nothing else.
        Include these fields (use empty string "" if missing):

        {
        "is_ktp": true|false,
        "nik": "16 digits",
        "nama": "string",
        "tempat_lahir": "string",
        "tanggal_lahir": "DD-MM-YYYY",
        "jenis_kelamin": "LAKI-LAKI" | "PEREMPUAN",
        "golongan_darah": "A" | "B" | "O" | "AB" | "",
        "alamat": "string",
        "rt_rw": "XXX/XXX",
        "kel_desa": "string",
        "kecamatan": "string",
        "kabupaten_kota": "string",
        "provinsi": "string",
        "tempat_dikeluarkan": "string",
        "tanggal_dikeluarkan": "DD-MM-YYYY" | "",
        "masa_berlaku": "DD-MM-YYYY" | "SEUMUR HIDUP" | "",
        "agama": "string",
        "status_perkawinan": "BELUM KAWIN" | "KAWIN" | "CERAI HIDUP" | "CERAI MATI" | "",
        "pekerjaan": "string",
        "kewarganegaraan": "WNI" | "WNA" | ""
        }

        Rules / constraints:
        - nik must be 16 digits (string).
        - tanggal fields must be DD-MM-YYYY when present.
        - If masa_berlaku is lifelong, return "SEUMUR HIDUP".
        - rt_rw must be XXX/XXX (3 digits / 3 digits), if missing return "000/000".
        - provinsi and kabupaten_kota must be the administrative names as printed on the KTP.
        - If image is not a KTP, set "is_ktp": false and set all other fields to empty (rt_rw "000/000").
        - nama can contain "."
        Return exactly one JSON object.
        `;

    const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            {
            role: "user",
            content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
            ],
            },
        ],
        temperature: 0,
    });

    const raw = response.choices[0].message?.content || "{}";
    console.log(raw)
    const textResponse = cleanJsonResponse(raw ?? "");
    // console.log(textResponse)
    let jsonResult: KtpData | any;
    try {
        const cleaned = cleanJsonResponse(textResponse);
        const parsed = JSON.parse(cleaned);
        jsonResult = normalizeKtpData(parsed);
    } catch {
        jsonResult = { raw: textResponse };
    }

    return jsonResult;
}