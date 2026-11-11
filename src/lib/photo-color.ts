import { loadImage } from "@/lib/crop-image";

export type PhotoColorValues = {
  red: number;
  green: number;
  blue: number;
};

export type PhotoColorChannel = keyof PhotoColorValues;

export const DEFAULT_PHOTO_COLORS: PhotoColorValues = {
  red: 0,
  green: 0,
  blue: 0,
};

export function hasColorChanges(values: PhotoColorValues): boolean {
  return values.red !== 0 || values.green !== 0 || values.blue !== 0;
}

export function clampColorAdjustment(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(-100, Math.min(100, Math.round(value)));
}

export function adjustRgbPixels(
  pixels: Uint8ClampedArray,
  values: PhotoColorValues,
): void {
  const red = clampColorAdjustment(values.red);
  const green = clampColorAdjustment(values.green);
  const blue = clampColorAdjustment(values.blue);

  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] += red;
    pixels[index + 1] += green;
    pixels[index + 2] += blue;

    // Kanal alpha pada index + 3 tetap dipertahankan.
  }
}

export async function createColorAdjustedPhoto(
  source: string,
  values: PhotoColorValues,
): Promise<Blob> {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context || !canvas.width || !canvas.height) {
    throw new Error("Foto belum dapat diproses. Silakan pilih foto lagi.");
  }

  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  adjustRgbPixels(imageData.data, values);

  context.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Hasil koreksi warna belum dapat dibuat."));
      }
    }, "image/png");
  });
}
