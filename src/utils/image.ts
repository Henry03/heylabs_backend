import sharp from "sharp";

export async function compressImage(
  buffer: Buffer,
  mimeType: string,
  maxSize: number
): Promise<Buffer> {
  let quality = 80;
  let output = buffer;

  // Convert everything to JPEG for best compression ratio
  while (output.length > maxSize && quality > 30) {
    output = await sharp(buffer)
      .rotate()
      .jpeg({ quality })
      .toBuffer();

    quality -= 10;
  }

  return output;
}