function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

export async function setPngDpi(blob: Blob, dpi: number | null): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());

  const view = new DataView(bytes.buffer);

  const parts: BlobPart[] = [bytes.slice(0, 8)];

  let inserted = false;

  for (let offset = 8; offset < bytes.length; ) {
    const length = view.getUint32(offset);
    const end = offset + length + 12;

    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));

    if (type === "IDAT" && !inserted && dpi !== null) {
      const chunk = new Uint8Array(21);
      const chunkView = new DataView(chunk.buffer);

      chunkView.setUint32(0, 9);

      // Nama chunk: pHYs.
      chunk.set([112, 72, 89, 115], 4);

      const pixelsPerMetre = Math.round(dpi / 0.0254);

      chunkView.setUint32(8, pixelsPerMetre);
      chunkView.setUint32(12, pixelsPerMetre);

      // Unit dalam meter.
      chunk[16] = 1;

      chunkView.setUint32(17, crc32(chunk.slice(4, 17)));

      parts.push(chunk);
      inserted = true;
    }

    // Ganti metadata resolusi lama jika ada.
    if (type !== "pHYs") {
      parts.push(bytes.slice(offset, end));
    }

    offset = end;
  }

  return new Blob(parts, {
    type: "image/png",
  });
}
