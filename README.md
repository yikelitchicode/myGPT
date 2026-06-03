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

`OPENAI_IMAGE_MODEL` only acts as a fallback default. The actual API key, base URL, and model can all be entered in the UI and are stored in `sessionStorage` only for the current browser session.

## Local development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Import this repo into Vercel.
2. Optionally set `OPENAI_IMAGE_MODEL` as a default.
3. Deploy.

## Notes

- The app supports two request paths: the default Vercel proxy route and a browser-direct provider mode for upstreams that allow CORS.
- In proxy mode, the user-provided key is still sent through the server route on each request. It is not persisted by the app, but it does traverse your Vercel function.
- The proxy route currently allows up to 120 seconds for validation, but long-running image requests still count toward Vercel function limits.
- A real job/polling flow still depends on the upstream image provider exposing an async job API. This repo's current OpenAI-compatible Images integration is synchronous.
- Image generation compatibility depends on whether your chosen endpoint supports the OpenAI Images API.
