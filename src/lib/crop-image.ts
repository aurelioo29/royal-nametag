import type { CropArea } from "@/types/id-card";

export type PixelCrop = CropArea;

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error("Foto tidak dapat dibuka."));
    };

    image.src = source;
  });
}

function cropImage(image: HTMLImageElement, crop: PixelCrop): string {
  const validCoordinates = Object.values(crop).every(Number.isFinite);

  if (!validCoordinates || crop.width < 1 || crop.height < 1) {
    throw new Error("Area crop belum siap.");
  }

  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Browser tidak mendukung pengolahan foto.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/png");
}

export async function getCroppedImg(
  source: string,
  pixels: PixelCrop,
): Promise<string> {
  const image = await loadImage(source);

  return cropImage(image, pixels);
}

export async function getCroppedImgFromPercent(
  source: string,
  area: CropArea,
): Promise<string> {
  const image = await loadImage(source);

  return cropImage(image, {
    x: (image.naturalWidth * area.x) / 100,
    y: (image.naturalHeight * area.y) / 100,
    width: (image.naturalWidth * area.width) / 100,
    height: (image.naturalHeight * area.height) / 100,
  });
}
