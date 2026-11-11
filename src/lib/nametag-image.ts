export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

export function validatePhoto(file: File): void {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Gunakan foto JPG, PNG, atau WebP.");
  }

  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error("Ukuran foto maksimal 10 MB.");
  }
}

export async function removePhotoBackground(
  file: File,
  signal: AbortSignal,
): Promise<Blob> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/remove-bg", {
    method: "POST",
    body,
    signal,
  });

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Batas pemrosesan tercapai. Coba lagi beberapa saat lagi."
        : "Background belum berhasil dihapus. Foto asli tetap bisa digunakan.",
    );
  }

  const blob = await response.blob();

  if (!blob.type.startsWith("image/")) {
    throw new Error("Server tidak mengembalikan gambar. Silakan coba lagi.");
  }

  return blob;
}

export async function croppedPhotoToFile(source: string): Promise<File> {
  const response = await fetch(source);
  const blob = await response.blob();

  return new File([blob], "nametag-photo.png", {
    type: blob.type || "image/png",
  });
}

export async function downloadCard(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const { toPng } = await import("html-to-image");

  await document.fonts.ready;

  await Promise.all(
    Array.from(element.querySelectorAll("img")).map((image) => image.decode()),
  );

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  if (element.querySelector('[data-text-overflow="true"]')) {
    throw new Error(
      "Teks melebihi area kartu. Kecilkan ukuran teks atau ringkas isian sebelum mengunduh.",
    );
  }

  const url = await toPng(element, {
    cacheBust: true,
    pixelRatio: 3,
  });

  const anchor = document.createElement("a");

  anchor.download = filename;
  anchor.href = url;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function cardFilename(type: string, name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-");

  return `${type}-${slug || "nametag"}.png`;
}
