import { NextResponse } from "next/server";
import { getImageModel, getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);
const ALLOWED_QUALITIES = new Set(["low", "medium", "high"]);
const ALLOWED_OUTPUT_FORMATS = new Set(["png", "jpeg", "webp"]);

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readStringField(formData, key, fallback = "") {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function readAllowedField(formData, key, allowedValues, fallback) {
  const value = readStringField(formData, key, fallback);
  return allowedValues.has(value) ? value : fallback;
}

function getErrorStatus(error) {
  const status = Number(error?.status);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

function getErrorMessage(error) {
  const rawMessage =
    error?.error?.message ||
    error?.message ||
    "Image generation failed.";
  const normalizedMessage = String(rawMessage);
  const loweredMessage = normalizedMessage.toLowerCase();
  const status = getErrorStatus(error);

  if (
    status === 524 ||
    loweredMessage.includes("524") ||
    loweredMessage.includes("timed out") ||
    loweredMessage.includes("timeout") ||
    loweredMessage.includes("etimedout")
  ) {
    return "The upstream image provider timed out. Try lower quality, fewer reference images, or a faster base URL.";
  }

  return normalizedMessage;
}

export async function POST(request) {
  try {
    const apiKey = request.headers.get("x-openai-api-key")?.trim();
    const baseURL = request.headers.get("x-openai-base-url")?.trim();
    const requestedModel = request.headers.get("x-openai-image-model")?.trim();
    const formData = await request.formData();
    const prompt = readStringField(formData, "prompt");
    const size = readAllowedField(formData, "size", ALLOWED_SIZES, "1024x1024");
    const quality = readAllowedField(formData, "quality", ALLOWED_QUALITIES, "medium");
    const outputFormat = readAllowedField(formData, "format", ALLOWED_OUTPUT_FORMATS, "png");
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
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
