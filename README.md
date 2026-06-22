# Pocket Image Lab

Mobile-first image generation app built with Next.js for deployment on Vercel Hobby.

## What it does

- Text-to-image generation
- Optional reference-image editing
- No database
- Session-only login with user-provided API key
- No history persistence
- Custom OpenAI-compatible API endpoint per session

## Environment variables

Optional:

```bash
OPENAI_IMAGE_MODEL=gpt-image-2
```

The actual API key, base URL, and model can all be entered in the UI and are stored in `sessionStorage` only for the current browser session. If the model field is left blank, the app will omit `model` from the upstream request and let the provider decide its default behavior.

## Local development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Import this repo into Vercel.
2. `OPENAI_IMAGE_MODEL` is optional and only useful if you later decide to restore a server-side default model behavior.
3. Deploy.

## Notes

- The app stores the user-provided key in the current browser session and sends generation requests through `/api/generate`, so the browser only talks to your own Vercel app.
- The app now supports both immediate image responses and async job flows. `/api/generate` can return a finished image set immediately or a `jobId`, and the client will poll `/api/generate/:jobId` until the result is ready.
- Your provider does not need browser CORS enabled for this flow, but it still needs to support the OpenAI-compatible Images API.
- Some image-only providers support `gpt-image-2` on `/v1/images/generations` and `/v1/images/edits` without supporting `/v1/models`, so this app does not block login on a `/models` validation step.
- Returned image payloads can be normalized from `url`, `b64_json`, or `image`.
