import { loadImage } from "@/lib/crop-image";

export async function applyBackgroundMask(
  original: File,
  removedBackground: Blob,
): Promise<Blob> {
  const originalUrl = URL.createObjectURL(original);
  const maskUrl = URL.createObjectURL(removedBackground);

  try {
    const [photo, mask] = await Promise.all([
      loadImage(originalUrl),
      loadImage(maskUrl),
    ]);

    const width = photo.naturalWidth;
    const height = photo.naturalHeight;
    const maskWidth = mask.naturalWidth;
    const maskHeight = mask.naturalHeight;

    if (!width || !height || !maskWidth || !maskHeight) {
      throw new Error("Ukuran foto atau masker tidak bisa dibaca.");
    }

    // Izinkan selisih kecil karena pembulatan saat API me-resize.
    const expectedMaskHeight = (maskWidth * height) / width;

    if (Math.abs(maskHeight - expectedMaskHeight) > 2) {
      throw new Error(
        "Proporsi masker berbeda dari foto asli. Pastikan remove.bg memakai crop=false.",
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Browser tidak dapat memproses masker foto.");
    }

    // Warna dan detail berasal dari foto asli pada resolusi aslinya.
    context.drawImage(photo, 0, 0);

    // destination-in mengambil alpha dari hasil remove.bg.
    context.globalCompositeOperation = "destination-in";
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(mask, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Foto dengan masker belum bisa dibuat."));
        }
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(originalUrl);
    URL.revokeObjectURL(maskUrl);
  }
}
