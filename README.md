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

- The app uses a server-side API route, but the user-provided key is still sent through that route on each request. It is not persisted by the app, but it does traverse your Vercel function.
- Vercel Hobby supports this pattern through serverless functions, but long-running image requests still count toward free-plan limits.
- Image generation compatibility depends on whether your chosen endpoint supports the OpenAI Images API.
