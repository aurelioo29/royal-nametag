import { loadImage } from "@/lib/crop-image";
import { templateConfigs, type TextConfig } from "@/lib/templates";
import type { IdCardData } from "@/types/id-card";

export type RenderOptions = {
  data: IdCardData;
  nameFontSize?: number | null;
  roleFontSize?: number | null;
  strictText?: boolean;
};

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
): string[] {
  const lines: string[] = [];
  let line = "";

  for (const word of text.trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word;

    if (context.measureText(candidate).width <= width) {
      line = candidate;
      continue;
    }

    if (line) {
      lines.push(line);
      line = "";
    }

    for (const character of Array.from(word)) {
      if (line && context.measureText(line + character).width > width) {
        lines.push(line);
        line = "";
      }

      line += character;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  config: TextConfig,
  override: number | null,
): boolean {
  let size = override ?? config.fontSize;
  let lines: string[] = [];

  while (true) {
    context.font = `${config.fontWeight} ${size}px ${config.fontFamily}`;
    lines = wrapText(context, text, config.width);

    const fits =
      lines.length * size <= config.height &&
      lines.every((line) => context.measureText(line).width <= config.width);

    if (fits || override !== null || size <= config.minFontSize) {
      break;
    }

    size = Math.max(config.minFontSize, size - 0.5);
  }

  const overflow =
    lines.length * size > config.height ||
    lines.some((line) => context.measureText(line).width > config.width);

  context.save();
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = config.color;
  context.lineJoin = "round";

  const shadow = config.textShadow?.match(
    /^(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+([\d.]+)(?:px)?\s+(.+)$/,
  );

  if (shadow) {
    context.shadowOffsetX = Number(shadow[1]);
    context.shadowOffsetY = Number(shadow[2]);
    context.shadowBlur = Number(shadow[3]);
    context.shadowColor = shadow[4];
  }

  lines.forEach((line, index) => {
    const x = config.left + config.width / 2;
    const y = config.top + index * size;

    if (config.textStroke && config.textStrokeColor) {
      context.lineWidth = Number.parseFloat(config.textStroke);
      context.strokeStyle = config.textStrokeColor;
      context.strokeText(line, x, y);
    }

    context.fillText(line, x, y);
  });

  context.restore();

  return overflow;
}

export async function renderNametag({
  data,
  nameFontSize = null,
  roleFontSize = null,
  strictText = false,
}: RenderOptions) {
  const config = templateConfigs[data.type];

  const photoSource =
    data.removeBackground && data.processedPhoto
      ? data.processedPhoto
      : data.originalPhoto;

  const fonts = [
    document.fonts.load(
      `${config.name.fontWeight} ${config.name.fontSize}px ${config.name.fontFamily}`,
    ),
  ];

  if (config.role) {
    fonts.push(
      document.fonts.load(
        `${config.role.fontWeight} ${config.role.fontSize}px ${config.role.fontFamily}`,
      ),
    );
  }

  await Promise.all(fonts);
  await document.fonts.ready;

  const [background, photo] = await Promise.all([
    loadImage(config.background),
    photoSource ? loadImage(photoSource) : Promise.resolve(null),
  ]);

  if (
    background.naturalWidth !== config.sourceWidth ||
    background.naturalHeight !== config.sourceHeight
  ) {
    throw new Error(
      `Ukuran template ${data.type} adalah ` +
        `${background.naturalWidth} × ${background.naturalHeight} px. ` +
        `Gunakan template asli ${config.sourceWidth} × ${config.sourceHeight} px.`,
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = background.naturalWidth;
  canvas.height = background.naturalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Browser tidak mendukung ekspor gambar.");
  }

  // Gambar template pada ukuran piksel aslinya.
  context.drawImage(background, 0, 0);

  const scale = canvas.width / config.cardWidth;
  context.scale(scale, scale);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const area = config.photo;
  let photoUpscaled = false;

  if (photo) {
    const isMagang = data.type === "magang";
    const widthRatio = area.width / photo.naturalWidth;
    const heightRatio = area.height / photo.naturalHeight;

    const ratio = isMagang
      ? Math.max(widthRatio, heightRatio)
      : Math.min(widthRatio, heightRatio);

    const width = photo.naturalWidth * ratio;
    const height = photo.naturalHeight * ratio;
    const x = area.left + (area.width - width) / 2;

    // Untuk crop Magang lama yang vertikal, pertahankan bagian atas.
    const y = isMagang ? area.top : area.top + area.height - height;

    context.save();

    if (isMagang) {
      context.beginPath();
      context.ellipse(
        area.left + area.width / 2,
        area.top + area.height / 2,
        area.width / 2,
        area.height / 2,
        0,
        0,
        Math.PI * 2,
      );
      context.clip();
    }

    context.drawImage(photo, x, y, width, height);
    context.restore();

    photoUpscaled = ratio * scale > 1.01;
  } else {
    context.fillStyle = "#78716c";
    context.font = "12px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(
      "Foto",
      area.left + area.width / 2,
      area.top + area.height / 2,
    );
  }

  // Clipping foto sudah selesai sebelum teks digambar.
  const nameOverflow = drawText(
    context,
    data.name.trim() || "Nama Lengkap",
    config.name,
    nameFontSize,
  );

  const roleOverflow =
    data.type === "pegawai" && config.role
      ? drawText(
          context,
          data.role.trim() || "Jabatan",
          config.role,
          roleFontSize,
        )
      : false;

  const textOverflow = nameOverflow || roleOverflow;

  if (strictText && textOverflow) {
    throw new Error(
      "Teks melebihi area kartu. Sesuaikan ukuran teks sebelum mengunduh.",
    );
  }

  return {
    canvas,
    textOverflow,
    photoUpscaled,
  };
}
