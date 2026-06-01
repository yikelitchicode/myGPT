import { NextResponse } from "next/server";
import { getImageModel, getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function POST(request) {
  try {
    const apiKey = request.headers.get("x-openai-api-key")?.trim();
    const baseURL = request.headers.get("x-openai-base-url")?.trim();
    const requestedModel = request.headers.get("x-openai-image-model")?.trim();
    const formData = await request.formData();
    const prompt = formData.get("prompt")?.toString().trim();
    const size = formData.get("size")?.toString() || "1024x1024";
    const quality = formData.get("quality")?.toString() || "medium";
    const outputFormat = formData.get("format")?.toString() || "png";
    const referenceImages = formData
      .getAll("referenceImage")
      .filter((value) => value instanceof File && value.size > 0)
      .slice(0, 16);
    const numberOfImages = Math.min(toPositiveInteger(formData.get("count"), 1), 2);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key." }, { status: 401 });
    }

    const client = getOpenAIClient({ apiKey, baseURL });
    const model = getImageModel(requestedModel);

    if (referenceImages.length > 0) {
      const result = await client.images.edit({
        model,
        image: referenceImages.length === 1 ? referenceImages[0] : referenceImages,
        prompt,
        size,
        quality,
        output_format: outputFormat,
        n: numberOfImages
      });

      return NextResponse.json({
        images: (result.data || []).map((item) => item.b64_json).filter(Boolean),
        mode: "edit",
        model
      });
    }

    const result = await client.images.generate({
      model,
      prompt,
      size,
      quality,
      output_format: outputFormat,
      n: numberOfImages
    });

    return NextResponse.json({
      images: (result.data || []).map((item) => item.b64_json).filter(Boolean),
      mode: "generate",
      model
    });
  } catch (error) {
    const status = error?.status || 500;
    const message =
      error?.error?.message ||
      error?.message ||
      "Image generation failed.";

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
