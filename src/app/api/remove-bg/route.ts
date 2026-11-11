export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        message: "Layanan hapus background belum dikonfigurasi.",
      },
      { status: 503 },
    );
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        {
          message: "Foto wajib disertakan.",
        },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (
      !allowedTypes.includes(file.type) ||
      file.size > 10 * 1024 * 1024 ||
      file.size === 0
    ) {
      return Response.json(
        {
          message: "Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 10 MB.",
        },
        { status: 400 },
      );
    }

    const body = new FormData();

    body.append("image_file", file);
    body.append("size", "auto");
    body.append("format", "png");
    body.append("crop", "false");

    const upstream = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body,
      signal: request.signal,
      cache: "no-store",
    });

    if (!upstream.ok) {
      return Response.json(
        {
          message: "Foto belum berhasil diproses.",
        },
        {
          status: upstream.status === 429 ? 429 : 502,
        },
      );
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        message: "Layanan hapus background belum dapat dihubungi.",
      },
      { status: 503 },
    );
  }
}
