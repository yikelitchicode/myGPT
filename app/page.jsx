"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_STORAGE_KEY = "pocket-image-lab-session";
const LOCALE_STORAGE_KEY = "pocket-image-lab-locale";
const RESULT_STORAGE_KEY = "pocket-image-lab-results";
const RESULT_DB_NAME = "pocket-image-lab-results-db";
const RESULT_STORE_NAME = "result-state";
const RESULT_RECORD_KEY = "history";
const WAIT_PROFILE_STORAGE_KEY = "pocket-image-lab-wait-profile";
const REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_WAIT_ESTIMATES = {
  generate: { low: 90, medium: 110, high: 120 },
  edit: { low: 100, medium: 115, high: 120 }
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
    validatingSession: "驗證金鑰中...",
    howItWorksEyebrow: "運作方式",
    howItWorksTitle: "不共用伺服器金鑰",
    howItWorksBody: "你的 Vercel 應用不會保存全域 API Key。",
    howItWorksMuted: "每次請求都使用你在本次工作階段輸入的金鑰，直接從前端呼叫你提供的圖片服務。",
    sessionEyebrow: "Session Active",
    logOut: "登出",
    prompt: "提示詞",
    promptPlaceholder: "描述你想生成的圖片，或說明要如何編修上傳的參考圖。",
    promptHints: "提示詞靈感",
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
    editImage: "編修圖片",
    generateImage: "生成圖片",
    outputEyebrow: "輸出",
    editedResult: "編修結果",
    freshRender: "生成結果",
    generatedResult: "生成結果",
    generatedAt: "生成時間",
    downloadPng: "下載 PNG",
    emptyTitle: "你的生成圖片會顯示在這裡。",
    emptyBody: "不寫入資料庫、沒有帳號狀態。圖片歷史只保留在這個分頁的工作階段中。",
    loadingTitle: "正在生成圖片",
    loadingBody: "請稍候，伺服器正在處理你的請求。",
    estimatedTotal: "預計等待",
    estimatedRemaining: "預估剩餘",
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
    invalidApiKey: "API Key 無效，或這個 Base URL 不支援 /models 驗證。",
    timeoutFailed: "圖片服務逾時。請改用較低品質、減少參考圖，或更換 Base URL。",
    corsFailed: "無法直接連到圖片服務。請確認上游已放行 CORS。",
    loginTimeoutFailed: "驗證金鑰逾時。請檢查 Base URL 或稍後再試。",
    somethingWentWrong: "發生未預期錯誤。",
    sizeSquare: "正方形",
    sizeLandscape: "橫向",
    sizePortrait: "直向",
    qualityBalanced: "平衡",
    qualitySharp: "精細",
    qualityFast: "快速",
    hints: ["電影感海報", "產品攝影", "動漫電影劇照", "水彩旅行速寫"]
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
    validatingSession: "Validating key...",
    howItWorksEyebrow: "How It Works",
    howItWorksTitle: "No shared server key",
    howItWorksBody: "Your Vercel app does not keep a global API key.",
    howItWorksMuted: "Each request uses the key entered in this session and calls your configured image provider directly from the browser.",
    sessionEyebrow: "Session Active",
    logOut: "Log out",
    prompt: "Prompt",
    promptPlaceholder: "Describe the image you want, or explain how the uploaded image should be edited.",
    promptHints: "Prompt hints",
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
    editImage: "Edit image",
    generateImage: "Generate image",
    outputEyebrow: "Output",
    editedResult: "Edited result",
    freshRender: "Fresh render",
    generatedResult: "Generated result",
    generatedAt: "Generated at",
    downloadPng: "Download PNG",
    emptyTitle: "Your generated image will appear here.",
    emptyBody: "No database and no account state. Image history stays only for this tab session.",
    loadingTitle: "Generating image",
    loadingBody: "Please wait while the server completes your request.",
    estimatedTotal: "Estimated total",
    estimatedRemaining: "Est. remaining",
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
    invalidApiKey: "The API key is invalid, or this base URL does not support /models validation.",
    timeoutFailed: "The image provider timed out. Try lower quality, fewer reference images, or another base URL.",
    corsFailed: "Direct provider access failed. Confirm the upstream allows CORS.",
    loginTimeoutFailed: "Key validation timed out. Check the base URL or try again later.",
    somethingWentWrong: "Something went wrong.",
    sizeSquare: "Square",
    sizeLandscape: "Landscape",
    sizePortrait: "Portrait",
    qualityBalanced: "Balanced",
    qualitySharp: "Sharp",
    qualityFast: "Fast",
    hints: ["editorial poster", "product photo", "anime cinematic still", "watercolor travel sketch"]
  }
};

export default function HomePage() {
  const [locale, setLocale] = useState("zh-Hant");
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("https://chickendog.cc/v1");
  const [imageModel, setImageModel] = useState("gpt-image-2");
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("medium");
  const [referenceImages, setReferenceImages] = useState([]);
  const [resultHistory, setResultHistory] = useState([]);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("generate");
  const [model, setModel] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(DEFAULT_WAIT_ESTIMATES.generate.medium);
  const [isDragging, setIsDragging] = useState(false);
  const referenceImagesRef = useRef([]);
  const requestStartedAtRef = useRef(0);

  const t = COPY[locale];
  const sizeOptions = [
    { value: "1024x1024", label: t.sizeSquare },
    { value: "1536x1024", label: t.sizeLandscape },
    { value: "1024x1536", label: t.sizePortrait }
  ];
  const qualityOptions = [
    { value: "medium", label: t.qualityBalanced },
    { value: "high", label: t.qualitySharp },
    { value: "low", label: t.qualityFast }
  ];
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
  const loadingBody = loadingPhase === "queueing" ? t.queueingBody : t.renderingBody;
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
            setImageModel(session.imageModel || "gpt-image-2");
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
        setEstimatedSeconds(waitProfiles.generate?.medium?.averageSeconds || DEFAULT_WAIT_ESTIMATES.generate.medium);
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
        mode: referenceImages.length ? "edit" : "generate"
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
      const response = await submitDirectImageRequest({
        apiKey,
        baseURL,
        imageModel,
        formData,
        referenceImages,
        signal: abortController.signal
      });

      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(payload.error || t.requestFailed);
      }

      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - requestStartedAtRef.current) / 1000)
      );
      const nextResults = (payload.images || []).map((image) => ({
        src: `data:image/png;base64,${image}`,
        mode: payload.mode || "generate",
        model: payload.model || "",
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
        mode: payload.mode || (referenceImages.length ? "edit" : "generate")
      });
      setMode(payload.mode || "generate");
      setModel(payload.model || "");
      setStatus("success");
    } catch (submitError) {
      const message = String(submitError?.message || "");
      const loweredMessage = message.toLowerCase();

      if (
        submitError?.name === "AbortError" ||
        loweredMessage.includes("timed out") ||
        loweredMessage.includes("timeout") ||
        loweredMessage.includes("524")
      ) {
        setError(t.timeoutFailed);
      } else if (
        submitError instanceof TypeError ||
        loweredMessage.includes("failed to fetch") ||
        loweredMessage.includes("cors")
      ) {
        setError(t.corsFailed);
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

  async function handleLogin(event) {
    event.preventDefault();

    if (!apiKey.trim()) {
      setError(t.apiKeyRequired);
      return;
    }

    if (!baseURL.trim()) {
      setError(t.baseUrlRequired);
      return;
    }

    setIsSigningIn(true);
    setError("");

    const abortController = new AbortController();
    const requestTimeout = window.setTimeout(() => {
      abortController.abort();
    }, 20_000);

    try {
      await validateSessionCredentials({
        apiKey,
        baseURL,
        signal: abortController.signal
      });

      const session = {
        apiKey: apiKey.trim(),
        baseURL: baseURL.trim() || "https://chickendog.cc/v1",
        imageModel: imageModel.trim() || "gpt-image-2"
      };

      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      setApiKey(session.apiKey);
      setBaseURL(session.baseURL);
      setImageModel(session.imageModel);
      setError("");
      setIsAuthenticated(true);
    } catch (loginError) {
      const message = String(loginError?.message || "");
      const loweredMessage = message.toLowerCase();

      if (
        loginError?.name === "AbortError" ||
        loweredMessage.includes("timed out") ||
        loweredMessage.includes("timeout")
      ) {
        setError(t.loginTimeoutFailed);
      } else if (
        loginError instanceof TypeError ||
        loweredMessage.includes("failed to fetch") ||
        loweredMessage.includes("cors")
      ) {
        setError(t.corsFailed);
      } else {
        setError(message || t.invalidApiKey);
      }
    } finally {
      window.clearTimeout(requestTimeout);
      setIsSigningIn(false);
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setApiKey("");
    setBaseURL("https://chickendog.cc/v1");
    setImageModel("gpt-image-2");
    setPrompt("");
    referenceImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setReferenceImages([]);
    setError("");
    setModel("");
    setMode("generate");
    setStatus("idle");
    setElapsedSeconds(0);
    setEstimatedSeconds(DEFAULT_WAIT_ESTIMATES.generate.medium);
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
                onChange={(event) => setImageModel(event.target.value)}
                placeholder="gpt-image-2"
                autoComplete="off"
              />
            </label>

            <button className="submit" type="submit" disabled={isSigningIn}>
              {isSigningIn ? t.validatingSession : t.startSession}
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

            <div className="hint-row" aria-label={t.promptHints}>
              {t.hints.map((hint) => (
                <button key={hint} type="button" className="chip" onClick={() => applyStyleHint(hint)}>
                  {hint}
                </button>
              ))}
            </div>

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
                <h2>{(outputResult?.mode || mode) === "edit" ? t.editedResult : t.freshRender}</h2>
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
                <p className="loading-time">
                  {t.elapsed} <strong>{elapsedSeconds}</strong> {t.seconds}
                </p>
                <p className="loading-time">
                  {t.estimatedTotal} <strong>{estimatedSeconds}</strong> {t.seconds}
                </p>
                <p className="loading-time">
                  {t.estimatedRemaining} <strong>{remainingSeconds}</strong> {t.seconds}
                </p>
              </div>
            ) : currentResult ? (
              <div className="result-card">
                <img src={currentResult.src} alt={t.generatedResult} />
                <p className="result-meta">
                  {t.generatedAt} {formatResultTime(currentResult.createdAt, locale)}
                </p>
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

function getEstimatedWaitSeconds({ quality, mode }) {
  const profiles = readWaitProfiles();
  const fallback = DEFAULT_WAIT_ESTIMATES[mode]?.[quality] || DEFAULT_WAIT_ESTIMATES.generate.medium;
  const storedAverage = profiles?.[mode]?.[quality]?.averageSeconds;

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

function writeWaitProfile({ durationSeconds, quality, mode }) {
  if (typeof window === "undefined") {
    return;
  }

  const profiles = readWaitProfiles();
  const fallback = DEFAULT_WAIT_ESTIMATES[mode]?.[quality] || DEFAULT_WAIT_ESTIMATES.generate.medium;
  const currentBucket = profiles?.[mode]?.[quality] || {
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
      [quality]: {
        averageSeconds: nextAverageSeconds,
        sampleCount: nextSampleCount
      }
    }
  };

  window.localStorage.setItem(WAIT_PROFILE_STORAGE_KEY, JSON.stringify(nextProfiles));
}

function formatCopy(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
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

async function submitDirectImageRequest({
  apiKey,
  baseURL,
  imageModel,
  formData,
  referenceImages,
  signal
}) {
  const normalizedBaseURL = baseURL.trim().replace(/\/+$/, "");
  const endpoint = referenceImages.length ? "/images/edits" : "/images/generations";
  const upstreamFormData = new FormData();

  upstreamFormData.append("model", imageModel.trim() || "gpt-image-2");
  upstreamFormData.append("prompt", String(formData.get("prompt") || "").trim());
  upstreamFormData.append("size", String(formData.get("size") || "1024x1024"));
  upstreamFormData.append("quality", String(formData.get("quality") || "medium"));
  upstreamFormData.append("output_format", String(formData.get("format") || "png"));
  upstreamFormData.append("n", String(formData.get("count") || "1"));

  referenceImages.forEach((image) => {
    upstreamFormData.append("image", image.file);
  });

  const response = await fetch(`${normalizedBaseURL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: upstreamFormData,
    signal
  });

  if (!response.ok) {
    return response;
  }

  const payload = await readResponsePayload(response);
  const images = Array.isArray(payload.data) ? payload.data.map((item) => item?.b64_json).filter(Boolean) : [];

  return new Response(
    JSON.stringify({
      images,
      mode: referenceImages.length ? "edit" : "generate",
      model: imageModel.trim() || "gpt-image-2"
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    }
  );
}

async function validateSessionCredentials({ apiKey, baseURL, signal }) {
  const normalizedBaseURL = baseURL.trim().replace(/\/+$/, "");
  const response = await fetch(`${normalizedBaseURL}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`
    },
    signal
  });

  if (response.ok) {
    return;
  }

  const payload = await readResponsePayload(response);
  const status = response.status;
  const message = String(payload?.error?.message || payload?.error || "").trim();

  if (status === 401 || status === 403) {
    throw new Error("Invalid API key.");
  }

  if (status === 404) {
    throw new Error("This base URL does not expose GET /models.");
  }

  throw new Error(message || "Unable to validate this API key against GET /models.");
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
