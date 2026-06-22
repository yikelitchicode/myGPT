import OpenAI from "openai";

const DEFAULT_IMAGE_MODEL = "gpt-image-2";

export function getOpenAIClient({ apiKey, baseURL }) {
  const normalizedKey = apiKey?.trim();

  if (!normalizedKey) {
    throw new Error("Missing API key.");
  }

  const normalizedBaseURL = baseURL?.trim() || "https://chickendog.cc/v1";

  return new OpenAI({
    apiKey: normalizedKey,
    baseURL: normalizedBaseURL
  });
}

export function getImageModel(model) {
  const normalizedModel = model?.trim();
  return normalizedModel || DEFAULT_IMAGE_MODEL;
}
