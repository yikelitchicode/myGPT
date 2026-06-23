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

async function callImageJobStatus({ apiKey, normalizedBaseURL, jobId, signal }) {
  return fetch(`${normalizedBaseURL}/images/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    signal
  });
}

export async function GET(request, { params }) {
  const startedAt = Date.now();

  try {
    const apiKey = request.headers.get("x-openai-api-key")?.trim();
    const baseURL = request.headers.get("x-openai-base-url")?.trim();
    const requestedModel = request.headers.get("x-openai-image-model")?.trim();
    const jobId = params?.jobId?.trim();

    if (!jobId) {
      return NextResponse.json({ error: "Missing job id." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key." }, { status: 401 });
    }

    const normalizedBaseURL = sanitizeBaseURL(baseURL);
    const model = getImageModel(requestedModel);
    const upstreamResponse = await callImageJobStatus({
      apiKey,
      normalizedBaseURL,
      jobId,
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

    const normalizedPayload = normalizeImageResponse(payload, {
      mode: payload?.mode || payload?.result?.mode || "generate",
      model: payload?.model || payload?.result?.model || model
    });

    console.info("[api/generate/job] success", {
      jobId,
      baseURL: normalizedBaseURL,
      model: normalizedPayload.model,
      status: normalizedPayload.status,
      imageCount: normalizedPayload.images.length,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json(normalizedPayload);
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    const diagnostic = classifyError(error);

    console.error("[api/generate/job] failure", {
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
