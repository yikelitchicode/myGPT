"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_STORAGE_KEY = "pocket-image-lab-session";
const LOCALE_STORAGE_KEY = "pocket-image-lab-locale";
const RESULT_STORAGE_KEY = "pocket-image-lab-results";
const RESULT_DB_NAME = "pocket-image-lab-results-db";
const RESULT_STORE_NAME = "result-state";
const RESULT_RECORD_KEY = "history";
const WAIT_PROFILE_STORAGE_KEY = "pocket-image-lab-wait-profile";
const REQUEST_TIMEOUT_MS = 300_000;
const JOB_POLL_INTERVAL_MS = 2_500;
const PROGRESS_FREEZE_PERCENT = 83;
const PROGRESS_MIN_TICK_MS = 5_000;
const PROGRESS_MAX_TICK_MS = 8_000;
const DEFAULT_IMAGE_MODEL = "gpt-image-2";
const QUALITY_COMPAT_MAP = {
  low: "1k",
  medium: "2k",
  high: "4k",
  "1k": "1k",
  "2k": "2k",
  "4k": "4k"
};
const DEFAULT_WAIT_ESTIMATES = {
  generate: { "1k": 85, "2k": 97, "4k": 110 },
  edit: { "1k": 95, "2k": 108, "4k": 122 }
};

const COPY = {
  "zh-Hant": {
    localeLabel: "EN",
    heroEyebrow: "手機圖片生成工作台",
    heroTitle: "Pocket Image Lab",
    signInEyebrow: "登入",
    signInTitle: "使用你自己的金鑰",
    signInBody: "API Key 只會保存在這個瀏覽器分頁的工作階段中。登出或關閉分頁後會清除，但圖片歷史會保留到你關閉這個分頁為止。",
    apiKey: "API Key",
    baseUrl: "Base URL",
    imageModel: "圖片模型",
    startSession: "開始工作階段",
    howItWorksEyebrow: "運作方式",
    howItWorksTitle: "不共用伺服器金鑰",
    howItWorksBody: "你的 Vercel 應用不會保存全域 API Key。",
    howItWorksMuted: "每次請求都使用你在本次工作階段輸入的金鑰，並由本站伺服器代為轉發到你提供的圖片服務。",
    sessionEyebrow: "Session Active",
    logOut: "登出",
    prompt: "提示詞",
    promptPlaceholder: "描述你想生成的圖片，或說明要如何參考上傳圖片來生成新圖。",
    promptHelpers: "提示工具",
    promptSamples: "示範 Prompt",
    promptHints: "添加 Hints",
    promptSamplesBody: "直接帶入一段完整示範 prompt，再依需求微調。",
    promptHintsBody: "快速補上風格、鏡頭、材質、光線與構圖等關鍵字。",
    usePrompt: "套用",
    addHint: "加入",
    expandHints: "展開更多",
    collapseHints: "收合",
    aspect: "比例",
    quality: "品質",
    referenceImage: "參考圖片（可選，最多 16 張）",
    referencePreview: "參考圖片預覽",
    uploadHint: "拖拉圖片到這裡，或點擊選取檔案",
    uploadFormats: "支援 PNG、JPG、WEBP，可一次上傳多張。",
    removeImage: "移除圖片",
    generating: "生成中...",
    queueingTitle: "排隊中",
    queueingBody: "請求已送出，正在等待伺服器開始處理。",
    renderingTitle: "生成中",
    renderingBody: "模型正在繪製圖片，完成後會自動顯示。",
    editImage: "參考生成",
    generateImage: "生成圖片",
    outputEyebrow: "輸出",
    editedResult: "參考生成結果",
    freshRender: "生成結果",
    generatedResult: "生成結果",
    generatedAt: "生成時間",
    referenceAnalysis: "參考圖分析",
    referenceAnalysisBody: "系統先讀取上傳圖片，整理出這段視覺描述，再用它輔助生成。",
    downloadPng: "下載 PNG",
    emptyTitle: "你的生成圖片會顯示在這裡。",
    emptyBody: "不寫入資料庫、沒有帳號狀態。圖片歷史只保留在這個分頁的工作階段中。",
    loadingTitle: "正在生成圖片",
    loadingBody: "請稍候，伺服器正在處理你的請求。",
    loadingProgress: "目前進度",
    loadingAlmostThere: "已進入最後階段，等待圖片返回。",
    elapsed: "已等待",
    seconds: "秒",
    clearCurrent: "清除目前照片",
    restorePrevious: "找回上一張",
    previousImage: "上一張",
    nextImage: "下一張",
    jumpToImage: "跳到第 {index} 張",
    resultPosition: "第 {current} 張 / 共 {total} 張",
    hiddenTitle: "目前沒有顯示中的照片。",
    hiddenBody: "你剛剛清除了目前顯示結果，但歷史照片還保留在這個工作階段中。",
    promptRequired: "請先輸入提示詞。",
    apiKeyRequired: "請輸入 API Key。",
    baseUrlRequired: "請輸入 Base URL。",
    requestFailed: "請求失敗。",
    invalidApiKey: "API Key 無效，或圖片服務拒絕了這次請求。",
    timeoutFailed: "圖片服務逾時。請改用較低品質、減少參考圖，或更換 Base URL。",
    somethingWentWrong: "發生未預期錯誤。",
    sizeSquare: "正方形",
    sizeLandscape: "橫向",
    sizePortrait: "直向",
    quality1k: "1k",
    quality2k: "2k",
    quality4k: "4k",
    hints: [
      "電影感海報",
      "產品攝影",
      "動漫電影劇照",
      "水彩旅行速寫",
      "柔和自然光",
      "高對比戲劇光",
      "逆光輪廓",
      "廣角鏡頭",
      "淺景深",
      "極簡留白",
      "雜誌編輯風",
      "超寫實細節",
      "霧面材質",
      "膠片顆粒",
      "乾淨背景",
      "高級配色"
    ],
    samplePrompts: [
      "一張高級雜誌封面風格的香水產品攝影，玻璃瓶置中，琥珀色液體折射暖光，米白石材底座，乾淨背景，細膩陰影，商業廣告質感，超高細節。",
      "一位年輕旅人站在山城雨夜的霓虹街口，濕潤路面反射橙紅與青藍燈光，電影感構圖，中景人物，薄霧空氣，寫實但帶一點詩意。",
      "日系動畫電影感的一碗拉麵特寫，熱氣上升，木質吧台與暖色燈籠背景，鏡頭貼近食物，湯面油光與配料細節豐富，溫暖療癒。"
    ]
  },
  en: {
    localeLabel: "繁中",
    heroEyebrow: "Mobile Imagegen on Vercel",
    heroTitle: "Pocket Image Lab",
    signInEyebrow: "Sign In",
    signInTitle: "Bring your own key",
    signInBody: "The API key is stored only in this browser tab session. Logout or close the tab clears the key, while image history stays until this tab is closed.",
    apiKey: "API key",
    baseUrl: "Base URL",
    imageModel: "Image model",
    startSession: "Start session",
    howItWorksEyebrow: "How It Works",
    howItWorksTitle: "No shared server key",
    howItWorksBody: "Your Vercel app does not keep a global API key.",
    howItWorksMuted: "Each request uses the key entered in this session and is forwarded by this app to your configured image provider.",
    sessionEyebrow: "Session Active",
    logOut: "Log out",
    prompt: "Prompt",
    promptPlaceholder: "Describe the image you want, or explain how the uploaded image should be used as reference for a new generation.",
    promptHelpers: "Prompt helpers",
    promptSamples: "Sample prompts",
    promptHints: "Add hints",
    promptSamplesBody: "Insert a full sample prompt, then tune it to fit your image.",
    promptHintsBody: "Quickly add style, lens, texture, lighting, and composition keywords.",
    usePrompt: "Use prompt",
    addHint: "Add",
    expandHints: "Show more",
    collapseHints: "Collapse",
    aspect: "Aspect",
    quality: "Quality",
    referenceImage: "Reference images (optional, up to 16)",
    referencePreview: "Reference preview",
    uploadHint: "Drag images here, or click to choose files",
    uploadFormats: "Supports PNG, JPG, and WEBP. You can upload multiple images.",
    removeImage: "Remove image",
    generating: "Generating...",
    queueingTitle: "Queued",
    queueingBody: "Your request has been sent and is waiting for server processing.",
    renderingTitle: "Rendering",
    renderingBody: "The model is drawing your image and will show it automatically when done.",
    editImage: "Generate from reference",
    generateImage: "Generate image",
    outputEyebrow: "Output",
    editedResult: "Reference-based result",
    freshRender: "Fresh render",
    generatedResult: "Generated result",
    generatedAt: "Generated at",
    referenceAnalysis: "Reference analysis",
    referenceAnalysisBody: "The system first reads the uploaded image, turns it into a visual description, and uses that description to guide generation.",
    downloadPng: "Download PNG",
    emptyTitle: "Your generated image will appear here.",
    emptyBody: "No database and no account state. Image history stays only for this tab session.",
    loadingTitle: "Generating image",
    loadingBody: "Please wait while the server completes your request.",
    loadingProgress: "Progress",
    loadingAlmostThere: "In the final stage. Waiting for the image to return.",
    elapsed: "Elapsed",
    seconds: "sec",
    clearCurrent: "Clear current image",
    restorePrevious: "Restore previous",
    previousImage: "Previous",
    nextImage: "Next",
    jumpToImage: "Jump to image {index}",
    resultPosition: "Image {current} of {total}",
    hiddenTitle: "There is no image currently shown.",
    hiddenBody: "The visible result was cleared, but your recent images are still kept in this session.",
    promptRequired: "Please enter a prompt.",
    apiKeyRequired: "Please enter an API key.",
    baseUrlRequired: "Please enter a base URL.",
    requestFailed: "Request failed.",
    invalidApiKey: "The API key is invalid, or the image provider rejected the request.",
    timeoutFailed: "The image provider timed out. Try lower quality, fewer reference images, or another base URL.",
    somethingWentWrong: "Something went wrong.",
    sizeSquare: "Square",
    sizeLandscape: "Landscape",
    sizePortrait: "Portrait",
    quality1k: "1k",
    quality2k: "2k",
    quality4k: "4k",
    hints: [
      "editorial poster",
      "product photo",
      "anime cinematic still",
      "watercolor travel sketch",
      "soft natural light",
      "dramatic contrast lighting",
      "backlit silhouette",
      "wide-angle lens",
      "shallow depth of field",
      "minimal negative space",
      "luxury magazine styling",
      "ultra detailed textures",
      "matte finish",
      "film grain",
      "clean background",
      "premium color palette"
    ],
    samplePrompts: [
      "Luxury editorial perfume product shot, centered glass bottle with amber liquid, warm refractions, off-white stone pedestal, clean background, refined shadows, premium commercial photography, ultra detailed.",
      "A young traveler standing at a neon-lit street corner in a mountain city at night, wet pavement reflecting orange and teal lights, cinematic composition, mid-shot portrait, light mist in the air, realistic with poetic mood.",
      "A cozy Japanese anime film-style ramen close-up, rising steam, wooden counter, warm lantern bokeh in the background, intimate food photography angle, rich broth highlights, highly detailed toppings, comforting atmosphere."
    ]
  }
};

export default function HomePage() {
  const [locale, setLocale] = useState("zh-Hant");
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("https://chickendog.cc/v1");
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("2k");
  const [referenceImages, setReferenceImages] = useState([]);
  const [resultHistory, setResultHistory] = useState([]);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("generate");
  const [model, setModel] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(DEFAULT_WAIT_ESTIMATES.generate["2k"]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activePromptHelperTab, setActivePromptHelperTab] = useState("samples");
  const [isHintsExpanded, setIsHintsExpanded] = useState(false);
  const referenceImagesRef = useRef([]);
  const requestStartedAtRef = useRef(0);

  const t = COPY[locale];
  const sizeOptions = [
    { value: "1024x1024", label: t.sizeSquare },
    { value: "1536x1024", label: t.sizeLandscape },
    { value: "1024x1536", label: t.sizePortrait }
  ];
  const qualityOptions = [
    { value: "1k", label: t.quality1k },
    { value: "2k", label: t.quality2k },
    { value: "4k", label: t.quality4k }
  ];
  const visibleHints = isHintsExpanded ? t.hints : t.hints.slice(0, 8);
  const currentResult =
    activeResultIndex >= 0 && activeResultIndex < resultHistory.length
      ? resultHistory[activeResultIndex]
      : null;
  const latestResult = resultHistory[resultHistory.length - 1] || null;
  const outputResult = currentResult || latestResult;
  const canClearCurrent = activeResultIndex >= 0;
  const canRestoreResult = activeResultIndex < resultHistory.length - 1;
  const canGoPrevious = activeResultIndex > 0;
  const canGoNext = activeResultIndex >= 0 && activeResultIndex < resultHistory.length - 1;
  const remainingSeconds = Math.max(estimatedSeconds - elapsedSeconds, 0);
  const queueThresholdSeconds = Math.max(2, Math.round(estimatedSeconds * 0.35));
  const loadingPhase = elapsedSeconds < queueThresholdSeconds ? "queueing" : "rendering";
  const loadingTitle = loadingPhase === "queueing" ? t.queueingTitle : t.renderingTitle;
  const loadingBody =
    progressPercent >= PROGRESS_FREEZE_PERCENT
      ? t.loadingAlmostThere
      : loadingPhase === "queueing"
        ? t.queueingBody
        : t.renderingBody;
  const visibleResultPosition =
    activeResultIndex >= 0
      ? formatCopy(t.resultPosition, {
          current: activeResultIndex + 1,
          total: resultHistory.length
        })
      : "";

  useEffect(() => {
    let isMounted = true;

    async function initializePage() {
      const savedSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      const waitProfiles = readWaitProfiles();

      if (savedLocale === "en" || savedLocale === "zh-Hant") {
        setLocale(savedLocale);
        document.documentElement.lang = savedLocale;
      } else {
        document.documentElement.lang = "zh-Hant";
      }

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (isMounted) {
            setApiKey(session.apiKey || "");
            setBaseURL(session.baseURL || "https://chickendog.cc/v1");
            setImageModel(DEFAULT_IMAGE_MODEL);
            setIsAuthenticated(false);
          }
        } catch {
          window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

      try {
        const persistedResults = await readPersistedResults();
        const history = Array.isArray(persistedResults?.resultHistory) ? persistedResults.resultHistory : [];
        const index = Number.isInteger(persistedResults?.activeResultIndex)
          ? persistedResults.activeResultIndex
          : history.length - 1;

        if (isMounted) {
          setResultHistory(history);
          setActiveResultIndex(Math.max(-1, Math.min(index, history.length - 1)));
        }
      } catch {
        clearLegacyResultStorage();
      }

      if (isMounted) {
        setEstimatedSeconds(
          getStoredAverageSeconds(waitProfiles, {
            mode: "generate",
            quality: "2k",
            size: "1024x1024"
          }) || DEFAULT_WAIT_ESTIMATES.generate["2k"]
        );
        setIsReady(true);
      }
    }

    initializePage();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [isReady, locale]);

  useEffect(() => {
    if (status !== "loading") {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "loading") {
      setProgressPercent(0);
      return;
    }

    let cancelled = false;
    let timer = null;

    setProgressPercent((current) => (current > 0 ? current : 4));

    const scheduleTick = () => {
      const delay = randomBetween(PROGRESS_MIN_TICK_MS, PROGRESS_MAX_TICK_MS);

      timer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        const elapsed = Math.max(0, (Date.now() - requestStartedAtRef.current) / 1000);
        const estimated = Math.max(estimatedSeconds, 1);
        const expected = Math.min(PROGRESS_FREEZE_PERCENT, Math.round((elapsed / estimated) * PROGRESS_FREEZE_PERCENT));

        setProgressPercent((current) => {
          if (current >= PROGRESS_FREEZE_PERCENT) {
            return PROGRESS_FREEZE_PERCENT;
          }

          const phase = getProgressPhase(current);
          const baseStep = getProgressStep({
            current,
            expected,
            phase,
            estimated,
            elapsed
          });
          const jitter = getProgressJitter(phase);
          const candidate = current + baseStep + jitter;
          const cappedCandidate = Math.min(candidate, getProgressPhaseCeiling(phase));
          const next = Math.max(cappedCandidate, expected);

          return Math.min(PROGRESS_FREEZE_PERCENT, next);
        });

        scheduleTick();
      }, delay);
    };

    scheduleTick();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [estimatedSeconds, status]);

  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    writePersistedResults({
      resultHistory,
      activeResultIndex
    }).catch(() => {});
  }, [activeResultIndex, isReady, resultHistory]);

  useEffect(() => {
    return () => {
      referenceImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!prompt.trim()) {
      setError(t.promptRequired);
      return;
    }

    setStatus("loading");
    requestStartedAtRef.current = Date.now();
    setElapsedSeconds(0);
    setEstimatedSeconds(
      getEstimatedWaitSeconds({
        quality,
        mode: "generate",
        size
      })
    );
    setError("");

    const formData = new FormData();
    formData.append("prompt", prompt.trim());
    formData.append("size", size);
    formData.append("quality", quality);
    formData.append("format", "png");
    formData.append("count", "1");

    referenceImages.forEach((image) => {
      formData.append("referenceImage", image.file);
    });

    const abortController = new AbortController();
    const requestTimeout = window.setTimeout(() => {
      abortController.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "x-openai-api-key": apiKey,
          "x-openai-base-url": baseURL,
          "x-openai-image-model": DEFAULT_IMAGE_MODEL
        },
        body: formData,
        signal: abortController.signal
      });

      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw toErrorWithPayload(payload, t.requestFailed);
      }

      const finalPayload =
        payload.status === "succeeded"
          ? payload
          : payload.jobId
            ? await pollGenerationJob({
                jobId: payload.jobId,
                apiKey,
                baseURL,
                imageModel: DEFAULT_IMAGE_MODEL,
                signal: abortController.signal
              })
            : payload;

      if (finalPayload.status && finalPayload.status !== "succeeded") {
        throw toErrorWithPayload(finalPayload, t.requestFailed);
      }

      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - requestStartedAtRef.current) / 1000)
      );
      const nextResults = (finalPayload.images || []).map((image) => ({
        src: image,
        mode: referenceImages.length ? "reference-generate" : (finalPayload.mode || "generate"),
        model: finalPayload.model || "",
        referenceDescription: finalPayload.referenceDescription || "",
        createdAt: Date.now()
      }));

      setResultHistory((current) => {
        const nextHistory = [...current, ...nextResults].slice(-12);
        setActiveResultIndex(nextHistory.length - 1);
        return nextHistory;
      });
      writeWaitProfile({
        durationSeconds,
        quality,
        mode: finalPayload.mode || "generate",
        size
      });
      setMode(referenceImages.length ? "reference-generate" : (finalPayload.mode || "generate"));
      setModel(finalPayload.model || "");
      setStatus("success");
    } catch (submitError) {
      const message = String(submitError?.message || "");
      const loweredMessage = message.toLowerCase();
      const source = String(submitError?.source || "");
      const type = String(submitError?.type || "");

      console.warn("[image-request] failed", {
        source: source || "unknown",
        type: type || "unknown",
        message
      });

      if (
        submitError?.name === "AbortError" ||
        type === "timeout" ||
        type === "runtime_timeout" ||
        loweredMessage.includes("function invocation timeout") ||
        loweredMessage.includes("serverless function has timed out") ||
        loweredMessage.includes("execution timed out") ||
        loweredMessage.includes("524")
      ) {
        setError(t.timeoutFailed);
      } else {
        setError(message || t.somethingWentWrong);
      }

      setStatus("error");
    } finally {
      window.clearTimeout(requestTimeout);
    }
  }

  function applyStyleHint(hint) {
    setPrompt((current) => {
      const trimmed = current.trim();
      return trimmed ? `${trimmed}，${hint}` : hint;
    });
  }

  function applySamplePrompt(samplePrompt) {
    setPrompt(samplePrompt);
  }

  function updateReferenceImages(fileList) {
    const incomingFiles = Array.from(fileList || []);

    if (!incomingFiles.length) {
      return;
    }

    setReferenceImages((current) => {
      const nextImages = [...current];

      for (const file of incomingFiles) {
        if (nextImages.length >= 16) {
          break;
        }

        const duplicate = nextImages.some(
          (image) =>
            image.file.name === file.name &&
            image.file.size === file.size &&
            image.file.lastModified === file.lastModified
        );

        if (duplicate) {
          continue;
        }

        nextImages.push({
          id: `${file.name}-${file.lastModified}-${file.size}`,
          file,
          previewUrl: URL.createObjectURL(file)
        });
      }

      return nextImages;
    });
  }

  function handleFileChange(event) {
    updateReferenceImages(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    updateReferenceImages(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsDragging(false);
  }

  function removeReferenceImage(id) {
    setReferenceImages((current) => {
      const imageToRemove = current.find((image) => image.id === id);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return current.filter((image) => image.id !== id);
    });
  }

  function handleLogin(event) {
    event.preventDefault();

    if (!apiKey.trim()) {
      setError(t.apiKeyRequired);
      return;
    }

    if (!baseURL.trim()) {
      setError(t.baseUrlRequired);
      return;
    }

    const session = {
      apiKey: apiKey.trim(),
      baseURL: baseURL.trim() || "https://chickendog.cc/v1",
      imageModel: DEFAULT_IMAGE_MODEL
    };

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setApiKey(session.apiKey);
    setBaseURL(session.baseURL);
    setImageModel(DEFAULT_IMAGE_MODEL);
    setError("");
    setIsAuthenticated(true);
  }

  function handleLogout() {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setApiKey("");
    setBaseURL("https://chickendog.cc/v1");
    setImageModel(DEFAULT_IMAGE_MODEL);
    setPrompt("");
    referenceImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setReferenceImages([]);
    setError("");
    setModel("");
    setMode("generate");
    setStatus("idle");
    setElapsedSeconds(0);
    setEstimatedSeconds(DEFAULT_WAIT_ESTIMATES.generate["2k"]);
    setProgressPercent(0);
    setIsAuthenticated(false);
  }

  function toggleLocale() {
    setLocale((current) => (current === "zh-Hant" ? "en" : "zh-Hant"));
  }

  function clearCurrentResult() {
    if (!canClearCurrent) {
      return;
    }

    setActiveResultIndex((current) => current - 1);
  }

  function restorePreviousResult() {
    if (!canRestoreResult) {
      return;
    }

    setActiveResultIndex((current) => current + 1);
  }

  function showPreviousResult() {
    if (!canGoPrevious) {
      return;
    }

    setActiveResultIndex((current) => current - 1);
  }

  function showNextResult() {
    if (!canGoNext) {
      return;
    }

    setActiveResultIndex((current) => current + 1);
  }

  function showResultAtIndex(index) {
    if (index < 0 || index >= resultHistory.length) {
      return;
    }

    setActiveResultIndex(index);
  }

  if (!isReady) {
    return (
      <main className="shell">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{t.heroEyebrow}</p>
            <h1>{t.heroTitle}</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-topbar">
            <p className="eyebrow">{t.heroEyebrow}</p>
            <button type="button" className="ghost locale-toggle" onClick={toggleLocale}>
              {t.localeLabel}
            </button>
          </div>
          <h1>{t.heroTitle}</h1>
        </div>
      </section>

      {!isAuthenticated ? (
        <section className="studio studio-auth">
          <form className="panel composer" onSubmit={handleLogin}>
            <div className="section-head">
              <p className="eyebrow">{t.signInEyebrow}</p>
              <h2>{t.signInTitle}</h2>
              <p className="muted">{t.signInBody}</p>
            </div>

            <label className="field">
              <span>{t.apiKey}</span>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </label>

            <label className="field">
              <span>{t.baseUrl}</span>
              <input
                type="url"
                value={baseURL}
                onChange={(event) => setBaseURL(event.target.value)}
                placeholder="https://chickendog.cc/v1"
                autoComplete="off"
              />
            </label>

            <label className="field">
              <span>{t.imageModel}</span>
              <input
                type="text"
                value={imageModel}
                onChange={() => {}}
                placeholder={DEFAULT_IMAGE_MODEL}
                readOnly
                autoComplete="off"
              />
            </label>

            <button className="submit" type="submit">
              {t.startSession}
            </button>

            {error ? <p className="message error">{error}</p> : null}
          </form>

          <aside className="panel output">
            <div className="output-head">
              <div>
                <p className="eyebrow">{t.howItWorksEyebrow}</p>
                <h2>{t.howItWorksTitle}</h2>
              </div>
            </div>
            <div className="empty-state">
              <p>{t.howItWorksBody}</p>
              <p className="muted">{t.howItWorksMuted}</p>
            </div>
          </aside>
        </section>
      ) : (
        <section className="studio">
          <form className="panel composer" onSubmit={handleSubmit}>
            <div className="session-bar">
              <div>
                <p className="eyebrow">{t.sessionEyebrow}</p>
                <p className="muted session-copy">{baseURL}</p>
              </div>
              <button type="button" className="ghost" onClick={handleLogout}>
                {t.logOut}
              </button>
            </div>

            <label className="field">
              <span>{t.prompt}</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t.promptPlaceholder}
                rows={7}
              />
            </label>

            <section className="prompt-helper" aria-label={t.promptHelpers}>
              <div className="prompt-helper-tabs" role="tablist" aria-label={t.promptHelpers}>
                <button
                  type="button"
                  role="tab"
                  className={`helper-tab${activePromptHelperTab === "samples" ? " active" : ""}`}
                  aria-selected={activePromptHelperTab === "samples"}
                  onClick={() => setActivePromptHelperTab("samples")}
                >
                  {t.promptSamples}
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`helper-tab${activePromptHelperTab === "hints" ? " active" : ""}`}
                  aria-selected={activePromptHelperTab === "hints"}
                  onClick={() => setActivePromptHelperTab("hints")}
                >
                  {t.promptHints}
                </button>
              </div>

              {activePromptHelperTab === "samples" ? (
                <div className="helper-panel">
                  <p className="helper-copy">{t.promptSamplesBody}</p>
                  <div className="sample-prompt-list">
                    {t.samplePrompts.map((samplePrompt) => (
                      <article key={samplePrompt} className="sample-prompt-card">
                        <p>{samplePrompt}</p>
                        <button type="button" className="ghost helper-action" onClick={() => applySamplePrompt(samplePrompt)}>
                          {t.usePrompt}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="helper-panel">
                  <div className="helper-panel-head">
                    <p className="helper-copy">{t.promptHintsBody}</p>
                    <button
                      type="button"
                      className="ghost helper-toggle"
                      onClick={() => setIsHintsExpanded((current) => !current)}
                      aria-expanded={isHintsExpanded}
                    >
                      {isHintsExpanded ? t.collapseHints : t.expandHints}
                    </button>
                  </div>
                  <div className="hint-row">
                    {visibleHints.map((hint) => (
                      <button key={hint} type="button" className="chip" onClick={() => applyStyleHint(hint)}>
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="grid-two">
              <label className="field">
                <span>{t.aspect}</span>
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  {sizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>{t.quality}</span>
                <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                  {qualityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field upload">
              <span>{t.referenceImage}</span>
              <label
                className={`dropzone${isDragging ? " dragging" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleFileChange}
                />
                <span className="dropzone-title">{t.uploadHint}</span>
                <span className="dropzone-copy">{t.uploadFormats}</span>
              </label>
            </div>

            {referenceImages.length ? (
              <div className="reference-grid">
                {referenceImages.map((image, index) => (
                  <div key={image.id} className="reference-preview">
                    <img src={image.previewUrl} alt={`${t.referencePreview} ${index + 1}`} />
                    <button
                      type="button"
                      className="preview-remove"
                      onClick={() => removeReferenceImage(image.id)}
                      aria-label={`${t.removeImage} ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <button className="submit" type="submit" disabled={status === "loading"}>
              {status === "loading" ? t.generating : referenceImages.length ? t.editImage : t.generateImage}
            </button>

            {error ? <p className="message error">{error}</p> : null}
          </form>

          <aside className="panel output">
            <div className="output-head">
              <div>
                <p className="eyebrow">{t.outputEyebrow}</p>
                <h2>{(outputResult?.mode || mode) === "reference-generate" ? t.editedResult : t.freshRender}</h2>
              </div>
              {outputResult?.model || model ? <span className="badge">{outputResult?.model || model}</span> : null}
            </div>

            <div className="output-actions">
              <button type="button" className="ghost output-action" onClick={clearCurrentResult} disabled={!canClearCurrent}>
                {t.clearCurrent}
              </button>
              <button
                type="button"
                className="ghost output-action"
                onClick={restorePreviousResult}
                disabled={!canRestoreResult}
              >
                {t.restorePrevious}
              </button>
            </div>

            {resultHistory.length ? (
              <>
                <div className="history-bar">
                  <button type="button" className="ghost history-nav" onClick={showPreviousResult} disabled={!canGoPrevious}>
                    {t.previousImage}
                  </button>
                  <p className="history-count">{visibleResultPosition}</p>
                  <button type="button" className="ghost history-nav" onClick={showNextResult} disabled={!canGoNext}>
                    {t.nextImage}
                  </button>
                </div>
                <div className="thumbnail-strip" aria-label={t.outputEyebrow}>
                  {resultHistory.map((result, index) => (
                    <button
                      key={`${result.createdAt}-${index}`}
                      type="button"
                      className={`thumbnail-card${index === activeResultIndex ? " active" : ""}`}
                      onClick={() => showResultAtIndex(index)}
                      aria-label={formatCopy(t.jumpToImage, { index: index + 1 })}
                      aria-pressed={index === activeResultIndex}
                    >
                      <img src={result.src} alt={`${t.generatedResult} ${index + 1}`} />
                      <span className="thumbnail-meta">{formatResultTime(result.createdAt, locale)}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {status === "loading" ? (
              <div className="loading-state" aria-live="polite">
                <div className="loading-orb" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="loading-phase">{loadingTitle}</p>
                <p className="loading-title">{t.loadingTitle}</p>
                <p className="muted">{loadingBody}</p>
                <div className="loading-progress" aria-label={t.loadingProgress}>
                  <div className="loading-progress-track">
                    <div className="loading-progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="loading-progress-meta">
                    <span>{t.loadingProgress}</span>
                    <strong>{progressPercent}%</strong>
                  </div>
                </div>
              </div>
            ) : currentResult ? (
              <div className="result-card">
                <img src={currentResult.src} alt={t.generatedResult} />
                <p className="result-meta">
                  {t.generatedAt} {formatResultTime(currentResult.createdAt, locale)}
                </p>
                {currentResult.referenceDescription ? (
                  <div className="reference-analysis">
                    <p className="reference-analysis-title">{t.referenceAnalysis}</p>
                    <p className="reference-analysis-body">{t.referenceAnalysisBody}</p>
                    <p className="reference-analysis-copy">{currentResult.referenceDescription}</p>
                  </div>
                ) : null}
                <a href={currentResult.src} download="pocket-image-lab.png" className="download">
                  {t.downloadPng}
                </a>
              </div>
            ) : resultHistory.length ? (
              <div className="empty-state">
                <p>{t.hiddenTitle}</p>
                <p className="muted">{t.hiddenBody}</p>
              </div>
            ) : (
              <div className="empty-state">
                <p>{t.emptyTitle}</p>
                <p className="muted">{t.emptyBody}</p>
              </div>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}

function readWaitProfiles() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(WAIT_PROFILE_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function normalizeQualityKey(quality) {
  return QUALITY_COMPAT_MAP[quality] || "2k";
}

function getStoredAverageSeconds(profiles, { mode, quality, size }) {
  const normalizedQuality = normalizeQualityKey(quality);
  const directAverage = profiles?.[mode]?.[normalizedQuality]?.[size]?.averageSeconds;

  if (directAverage) {
    return directAverage;
  }

  if (normalizedQuality === quality) {
    return null;
  }

  return profiles?.[mode]?.[quality]?.[size]?.averageSeconds || null;
}

function getEstimatedWaitSeconds({ quality, mode, size }) {
  const profiles = readWaitProfiles();
  const normalizedQuality = normalizeQualityKey(quality);
  const fallback =
    (DEFAULT_WAIT_ESTIMATES[mode]?.[normalizedQuality] || DEFAULT_WAIT_ESTIMATES.generate["2k"]) +
    getSizeWaitAdjustment(size);
  const storedAverage = getStoredAverageSeconds(profiles, {
    mode,
    quality,
    size
  });

  if (!storedAverage) {
    return fallback;
  }

  // Ignore stale low estimates from older builds so the loading UI stays realistic.
  if (storedAverage < fallback * 0.7) {
    return fallback;
  }

  return (
    storedAverage ||
    fallback
  );
}

function writeWaitProfile({ durationSeconds, quality, mode, size }) {
  if (typeof window === "undefined") {
    return;
  }

  const profiles = readWaitProfiles();
  const normalizedQuality = normalizeQualityKey(quality);
  const fallback =
    (DEFAULT_WAIT_ESTIMATES[mode]?.[normalizedQuality] || DEFAULT_WAIT_ESTIMATES.generate["2k"]) +
    getSizeWaitAdjustment(size);
  const currentBucket = profiles?.[mode]?.[normalizedQuality]?.[size] || {
    averageSeconds: fallback,
    sampleCount: 0
  };
  const baselineAverageSeconds =
    currentBucket.averageSeconds < fallback * 0.7 ? fallback : currentBucket.averageSeconds;
  const nextSampleCount = Math.min(currentBucket.sampleCount + 1, 12);
  const weight = Math.min(currentBucket.sampleCount, 11);
  const nextAverageSeconds = Math.round(
    (baselineAverageSeconds * weight + durationSeconds) / nextSampleCount
  );

  const nextProfiles = {
    ...profiles,
    [mode]: {
      ...(profiles[mode] || {}),
      [normalizedQuality]: {
        ...(profiles?.[mode]?.[normalizedQuality] || {}),
        [size]: {
          averageSeconds: nextAverageSeconds,
          sampleCount: nextSampleCount
        }
      }
    }
  };

  window.localStorage.setItem(WAIT_PROFILE_STORAGE_KEY, JSON.stringify(nextProfiles));
}

function formatCopy(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getProgressPhase(progressPercent) {
  if (progressPercent < 30) {
    return "early";
  }

  if (progressPercent < 70) {
    return "middle";
  }

  return "late";
}

function getProgressPhaseCeiling(phase) {
  if (phase === "early") {
    return 34;
  }

  if (phase === "middle") {
    return 74;
  }

  return PROGRESS_FREEZE_PERCENT;
}

function getProgressStep({ current, expected, phase, estimated, elapsed }) {
  const remaining = Math.max(PROGRESS_FREEZE_PERCENT - current, 0);
  const remainingTime = Math.max(estimated - elapsed, 1);
  const averageTickSeconds = (PROGRESS_MIN_TICK_MS + PROGRESS_MAX_TICK_MS) / 2000;
  const projectedSteps = Math.max(1, Math.round(remainingTime / averageTickSeconds));
  const catchUpStep = Math.max(1, Math.round((expected - current) * 0.7));

  if (phase === "early") {
    return Math.max(4, Math.round(remaining / Math.max(3, projectedSteps * 0.5)), catchUpStep);
  }

  if (phase === "middle") {
    return Math.max(2, Math.round(remaining / Math.max(5, projectedSteps * 0.85)), catchUpStep);
  }

  return Math.max(1, Math.round(remaining / Math.max(8, projectedSteps * 1.4)), Math.min(catchUpStep, 2));
}

function getProgressJitter(phase) {
  if (phase === "early") {
    return randomBetween(1, 3);
  }

  if (phase === "middle") {
    return randomBetween(0, 2);
  }

  return randomBetween(0, 1);
}

function getSizeWaitAdjustment(size) {
  if (typeof size !== "string") {
    return 0;
  }

  const [width, height] = size.split("x").map(Number);
  const maxEdge = Math.max(width || 0, height || 0);

  if (maxEdge <= 1024) {
    return 0;
  }

  if (maxEdge <= 1536) {
    return 12;
  }

  return 24;
}

async function readResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    error: (await response.text()).trim()
  };
}

function toErrorWithPayload(payload, fallbackMessage) {
  const error = new Error(payload?.error || fallbackMessage);
  error.source = payload?.source || "unknown";
  error.type = payload?.type || "unknown";
  error.retryable = Boolean(payload?.retryable);
  return error;
}

async function pollGenerationJob({ jobId, apiKey, baseURL, imageModel, signal }) {
  for (;;) {
    if (signal.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    const response = await fetch(`/api/generate/${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: {
        "x-openai-api-key": apiKey,
        "x-openai-base-url": baseURL,
        "x-openai-image-model": DEFAULT_IMAGE_MODEL
      },
      signal
    });
    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw toErrorWithPayload(payload, "Request failed.");
    }

    if (payload.status === "succeeded") {
      return payload;
    }

    if (payload.status === "failed") {
      throw toErrorWithPayload(payload, "Image generation failed.");
    }

    await waitForPoll(JOB_POLL_INTERVAL_MS, signal);
  }
}

function waitForPoll(durationMs, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, durationMs);

    function handleAbort() {
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    }

    function cleanup() {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", handleAbort);
    }

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function formatResultTime(timestamp, locale) {
  try {
    return new Intl.DateTimeFormat(locale === "zh-Hant" ? "zh-Hant-HK" : "en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

async function readPersistedResults() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return readLegacyResultStorage();
  }

  const database = await openResultsDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(RESULT_STORE_NAME, "readonly");
    const store = transaction.objectStore(RESULT_STORE_NAME);
    const request = store.get(RESULT_RECORD_KEY);

    request.onsuccess = () => {
      const value = request.result?.value || null;

      if (value) {
        clearLegacyResultStorage();
      }

      resolve(value || readLegacyResultStorage());
    };
    request.onerror = () => reject(request.error);
  });
}

async function writePersistedResults(value) {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const database = await openResultsDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(RESULT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(RESULT_STORE_NAME);
    const request = store.put({
      id: RESULT_RECORD_KEY,
      value
    });

    request.onsuccess = () => {
      clearLegacyResultStorage();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

function openResultsDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(RESULT_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(RESULT_STORE_NAME)) {
        database.createObjectStore(RESULT_STORE_NAME, {
          keyPath: "id"
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readLegacyResultStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const savedResults = window.sessionStorage.getItem(RESULT_STORAGE_KEY);

  if (!savedResults) {
    return null;
  }

  try {
    return JSON.parse(savedResults);
  } catch {
    clearLegacyResultStorage();
    return null;
  }
}

function clearLegacyResultStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
}
