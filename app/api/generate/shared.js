export function getErrorStatus(error) {
  const status = Number(error?.status);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

export function sanitizeBaseURL(baseURL) {
  return baseURL?.trim() || "https://chickendog.cc/v1";
}

export function getErrorMessage(error) {
  const rawMessage = error?.error?.message || error?.message || "Image generation failed.";
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

export async function readUpstreamPayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    error: (await response.text()).trim() || `Upstream returned ${response.status}.`
  };
}

export function getUpstreamErrorMessage(payload, fallback) {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload?.error?.message === "string" && payload.error.message.trim()) {
    return payload.error.message.trim();
  }

  return fallback;
}

function toImageSource(item) {
  if (typeof item === "string" && item.trim()) {
    return item.startsWith("http://") ||
      item.startsWith("https://") ||
      item.startsWith("data:")
      ? item
      : `data:image/png;base64,${item}`;
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  if (typeof item.url === "string" && item.url.trim()) {
    return item.url;
  }

  if (typeof item.b64_json === "string" && item.b64_json.trim()) {
    return `data:image/png;base64,${item.b64_json}`;
  }

  if (typeof item.image === "string" && item.image.trim()) {
    return item.image.startsWith("data:") ? item.image : `data:image/png;base64,${item.image}`;
  }

  return null;
}

export function extractImages(payload) {
  const collections = [
    payload?.data,
    payload?.images,
    payload?.result?.data,
    payload?.result?.images
  ];

  return collections
    .filter(Array.isArray)
    .flatMap((items) => items.map(toImageSource))
    .filter(Boolean);
}

function readJobStatus(payload) {
  const status =
    payload?.status ??
    payload?.state ??
    payload?.job?.status ??
    payload?.result?.status ??
    null;

  return typeof status === "string" && status.trim() ? status.trim().toLowerCase() : null;
}

function readJobId(payload) {
  const jobId =
    payload?.jobId ??
    payload?.job_id ??
    payload?.id ??
    payload?.job?.id ??
    payload?.result?.jobId ??
    payload?.result?.job_id ??
    null;

  return typeof jobId === "string" && jobId.trim() ? jobId.trim() : null;
}

export function normalizeImageResponse(payload, { mode, model }) {
  const images = extractImages(payload);
  const jobId = readJobId(payload);
  const status = readJobStatus(payload);

  if (images.length > 0) {
    return {
      status: "succeeded",
      images,
      jobId,
      mode,
      model
    };
  }

  if (jobId) {
    return {
      status: status || "processing",
      images: [],
      jobId,
      mode,
      model
    };
  }

  if (status === "failed") {
    const error = new Error(getUpstreamErrorMessage(payload, "Image generation failed."));
    error.status = 502;
    error.payload = payload;
    throw error;
  }

  return {
    status: status || "succeeded",
    images: [],
    jobId: null,
    mode,
    model
  };
}
