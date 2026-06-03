import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

function getErrorStatus(error) {
  const status = Number(error?.status);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

function getErrorMessage(error) {
  return String(error?.error?.message || error?.message || "Unable to validate API key.");
}

export async function GET(request) {
  try {
    const apiKey = request.headers.get("x-openai-api-key")?.trim();
    const baseURL = request.headers.get("x-openai-base-url")?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key." }, { status: 401 });
    }

    const client = getOpenAIClient({ apiKey, baseURL });
    await client.models.list();

    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status });
  }
}
