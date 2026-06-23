import { NextResponse } from "next/server";
import { getImageModel } from "@/lib/openai";
import {
  classifyError,
  getErrorMessage,
  getErrorStatus,
  getUpstreamErrorMessage,
  normalizeImageResponse,
  readUpstreamPayload,
  sanitizeBaseURL
} from "@/app/api/generate/shared";

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

async function callImageGeneration({
  apiKey,
  normalizedBaseURL,
  model,
  prompt,
  size,
  quality,
  outputFormat,
  numberOfImages,
  signal
}) {
  return fetch(`${normalizedBaseURL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      prompt,
      size,
      quality,
      output_format: outputFormat,
      n: numberOfImages
    }),
    signal
  });
}

async function callImageEdit({
  apiKey,
  normalizedBaseURL,
  model,
  prompt,
  size,
  quality,
  outputFormat,
  numberOfImages,
  referenceImages,
  signal
}) {
  const upstreamFormData = new FormData();

  if (model) {
    upstreamFormData.append("model", model);
  }
  upstreamFormData.append("prompt", prompt);
  upstreamFormData.append("size", size);
  upstreamFormData.append("quality", quality);
  upstreamFormData.append("output_format", outputFormat);
  upstreamFormData.append("n", String(numberOfImages));

  referenceImages.forEach((image) => {
    upstreamFormData.append("image", image);
  });

  return fetch(`${normalizedBaseURL}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: upstreamFormData,
    signal
  });
}

export async function POST(request) {
  const startedAt = Date.now();

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

    const normalizedBaseURL = sanitizeBaseURL(baseURL);
    const model = getImageModel(requestedModel);
    const mode = referenceImages.length > 0 ? "edit" : "generate";

    console.info("[api/generate] start", {
      mode,
      baseURL: normalizedBaseURL,
      model,
      size,
      quality,
      outputFormat,
      referenceImageCount: referenceImages.length,
      numberOfImages
    });

    const upstreamResponse = referenceImages.length
      ? await callImageEdit({
          apiKey,
          normalizedBaseURL,
          model,
          prompt,
          size,
          quality,
          outputFormat,
          numberOfImages,
          referenceImages,
          signal: request.signal
        })
      : await callImageGeneration({
          apiKey,
          normalizedBaseURL,
          model,
          prompt,
          size,
          quality,
          outputFormat,
          numberOfImages,
          signal: request.signal
        });

    const payload = await readUpstreamPayload(upstreamResponse);

    if (!upstreamResponse.ok) {
      const message = getUpstreamErrorMessage(
        payload,
        `Upstream returned ${upstreamResponse.status}.`
      );
      const error = new Error(message);
      error.status = upstreamResponse.status;
      error.payload = payload;
      throw error;
    }

    const normalizedPayload = normalizeImageResponse(payload, { mode, model });

    console.info("[api/generate] success", {
      mode,
      baseURL: normalizedBaseURL,
      model,
      status: normalizedPayload.status,
      imageCount: normalizedPayload.images.length,
      jobId: normalizedPayload.jobId,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json(normalizedPayload);
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    const diagnostic = classifyError(error);

    console.error("[api/generate] failure", {
      status,
      message,
      diagnostic,
      upstreamStatus: error?.status ?? null,
      upstreamCode: error?.code ?? null,
      upstreamType: error?.type ?? null,
      upstreamPayload: error?.payload ?? null,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json({ error: message, ...diagnostic }, { status });
  }
}
