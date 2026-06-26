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
const REFERENCE_ANALYSIS_MODEL = "gpt-4o";

const ALLOWED_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);
const ALLOWED_QUALITIES = new Set(["low", "medium", "high", "1k", "2k", "4k"]);
const ALLOWED_OUTPUT_FORMATS = new Set(["png", "jpeg", "webp"]);
const QUALITY_MAP = {
  "1k": "low",
  "2k": "medium",
  "4k": "high",
  low: "low",
  medium: "medium",
  high: "high"
};

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

function normalizeQuality(value) {
  return QUALITY_MAP[value] || "medium";
}

function getFileDataUrl(file, base64) {
  const mimeType = file.type?.trim() || "application/octet-stream";
  return `data:${mimeType};base64,${base64}`;
}

async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

function getChatCompletionText(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.type === "text" && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

async function describeReferenceImages({
  apiKey,
  normalizedBaseURL,
  prompt,
  referenceImages,
  signal
}) {
  const content = [
    {
      type: "text",
      text:
        "Analyze these reference images for downstream image generation. " +
        "Describe only visually observable attributes that are useful for recreating a related image: subject, pose, framing, composition, camera distance, perspective, color palette, lighting, texture, material, styling, mood, environment, and overall art direction. " +
        "Return one compact but detailed paragraph in English. Do not mention safety, policy, or speculate beyond what is visible. " +
        `User intent: ${prompt}`
    }
  ];

  for (const image of referenceImages) {
    const base64 = await fileToBase64(image);
    content.push({
      type: "image_url",
      image_url: {
        url: getFileDataUrl(image, base64)
      }
    });
  }

  return fetch(`${normalizedBaseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: REFERENCE_ANALYSIS_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You turn reference images into concise, high-signal visual descriptions for image generation prompts."
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.2
    }),
    signal
  });
}

function composeGenerationPrompt({ prompt, referenceDescription }) {
  if (!referenceDescription) {
    return prompt;
  }

  return [
    "User request:",
    prompt,
    "",
    "Reference image analysis:",
    referenceDescription,
    "",
    "Generate a new image that follows the user request while drawing visual inspiration from the reference image analysis. Do not describe the process or mention reference images in the output."
  ].join("\n");
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

export async function POST(request) {
  const startedAt = Date.now();

  try {
    const apiKey = request.headers.get("x-openai-api-key")?.trim();
    const baseURL = request.headers.get("x-openai-base-url")?.trim();
    const requestedModel = request.headers.get("x-openai-image-model")?.trim();
    const formData = await request.formData();
    const prompt = readStringField(formData, "prompt");
    const size = readAllowedField(formData, "size", ALLOWED_SIZES, "1024x1024");
    const requestedQuality = readAllowedField(formData, "quality", ALLOWED_QUALITIES, "2k");
    const quality = normalizeQuality(requestedQuality);
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
    const referenceAssistEnabled = referenceImages.length > 0;
    const mode = "generate";

    console.info("[api/generate] start", {
      mode,
      baseURL: normalizedBaseURL,
      model,
      size,
      quality,
      outputFormat,
      referenceAssistEnabled,
      referenceImageCount: referenceImages.length,
      numberOfImages
    });

    let generationPrompt = prompt;
    let referenceDescription = "";

    if (referenceAssistEnabled) {
      const analysisResponse = await describeReferenceImages({
        apiKey,
        normalizedBaseURL,
        prompt,
        referenceImages,
        signal: request.signal
      });
      const analysisPayload = await readUpstreamPayload(analysisResponse);

      if (!analysisResponse.ok) {
        const message = getUpstreamErrorMessage(
          analysisPayload,
          `Upstream returned ${analysisResponse.status}.`
        );
        const error = new Error(message);
        error.status = analysisResponse.status;
        error.payload = analysisPayload;
        throw error;
      }

      referenceDescription = getChatCompletionText(analysisPayload);

      if (!referenceDescription) {
        throw new Error("Reference image analysis returned no text.");
      }

      generationPrompt = composeGenerationPrompt({
        prompt,
        referenceDescription
      });
    }

    const upstreamResponse = await callImageGeneration({
      apiKey,
      normalizedBaseURL,
      model,
      prompt: generationPrompt,
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

    if (referenceAssistEnabled) {
      normalizedPayload.referenceDescription = referenceDescription;
    }

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
