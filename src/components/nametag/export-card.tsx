"use client";

import { renderNametag } from "@/lib/render-nametag";
import { setPngDpi } from "@/lib/png-dpi";
import { templateConfigs } from "@/lib/templates";
import { cardFilename } from "@/lib/nametag-image";

import type { IdCardData } from "@/types/id-card";

type ExportOptions = {
  data: IdCardData;
  nameFontSize: number | null;
  roleFontSize: number | null;
};

export async function exportNametag(options: ExportOptions): Promise<void> {
  const { canvas } = await renderNametag({
    ...options,
    strictText: true,
  });

  const rawPng = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG belum berhasil dibuat."));
      }
    }, "image/png");
  });

  const config = templateConfigs[options.data.type];

  const png = await setPngDpi(rawPng, config.sourceDpi);

  const url = URL.createObjectURL(png);

  const link = document.createElement("a");

  link.href = url;
  link.download = cardFilename(options.data.type, options.data.name);

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 30_000);
}
