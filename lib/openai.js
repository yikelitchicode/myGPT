import OpenAI from "openai";

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
  return model?.trim() || process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
}
