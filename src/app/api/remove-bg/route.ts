export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response("File is required", { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return new Response("Missing REMOVE_BG_API_KEY", { status: 500 });
    }

    const removeBgForm = new FormData();
    removeBgForm.append("image_file", file);
    removeBgForm.append("size", "auto");
    removeBgForm.append("format", "png");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: removeBgForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText || "remove.bg request failed", {
        status: response.status,
      });
    }

    const blob = await response.blob();

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Remove BG API route error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
