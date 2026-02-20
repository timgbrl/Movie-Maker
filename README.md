# Movie Maker

A Next.js web app that generates a short movie (30 seconds to 5 minutes) from one prompt using ChatGPT + Kling 3.0 style API flow.

## What it includes

- Screen 1: Generate 3 concept ideas
- Screen 2: Pick and customize one idea
- Screen 3: Generate final scene plan + Kling prompts
- Screen 4: Generate scene videos and merge with ffmpeg
- Screen 5: Preview and download final movie

## Project structure

```text
app/
  api/
    ideas/route.js
    generate-scenes/route.js
    render-movie/route.js
    movie/[id]/route.js
  output/                # generated scenes and final video
  globals.css
  layout.js
  page.js
components/
  IdeaCards.js
  CustomizationForm.js
  ScenePreview.js
lib/
  prompts.js
  openai.js
  kling.js
  video.js
  mock-data.js
.env.example
README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes on API behavior

- By default `USE_MOCK_DATA=true`, so ChatGPT and Kling calls are mocked.
- In mock mode, we still generate **real .mp4 scene clips** with ffmpeg and merge them into a final .mp4, so the full flow is testable without API keys.
- To use real APIs:
  - Set `USE_MOCK_DATA=false`
  - Add `OPENAI_API_KEY`
  - Add Kling credentials (preferred: `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` for JWT token signing)
  - Optional fallback: `KLING_API_KEY`
  - Set `KLING_API_BASE_URL` (default: `https://api-singapore.klingai.com`)
  - Optional: `KLING_CREATE_URL` (full create endpoint override; default `.../v1/videos/omni-video`)
  - Optional: `KLING_STATUS_URL_TEMPLATE` (e.g. `https://.../videos/{jobId}`)
  - Optional OmniVideo params: `KLING_MODEL` (default `kling-video-o1`), `KLING_MODE` (default `pro`), `KLING_ASPECT_RATIO` (default `1:1`)
- Kling integration is implemented as a REST stub with create + poll + download behavior.

## Where files are saved

- Scene clips and final movie are stored under `app/output/<movieId>/`.
- Final merged output is `app/output/<movieId>/final-movie.mp4`.
- The render API response includes this path in `savedTo`, and the UI also displays it.

## ffmpeg requirement

`/api/render-movie` uses ffmpeg to generate mock scene clips and to merge scenes. Install ffmpeg on your machine.

## Deterministic prompts

Prompt templates are in `lib/prompts.js` and request JSON-only outputs with fixed schema.


## Troubleshooting real APIs

If you still see mock outputs after setting keys:

- Restart the Next.js dev server after changing env vars (`Ctrl+C` then `npm run dev`).
- Ensure `.env.local` is being used (not only `.env.example`).
- Set `USE_MOCK_DATA=false` exactly (we also accept `0`, `off`, `no` as false).
- In the UI, check the provider badges:
  - `Ideas provider: openai` means real OpenAI is being used.
  - `Scene planner provider: openai` means the script/scene generation step used OpenAI (this is expected).
  - If either says `mock`, env/key detection failed for that step.
- `Video provider: kling` means the render step reached Kling successfully; `mock` means fallback/mock path.

- If render shows `fetch failed`, check the returned error text: it now includes the exact Kling URL that failed (DNS/network/auth/endpoint mismatch).
- Kling API responses with non-zero service code are now surfaced as explicit service errors (`code`, `message`, optional requestId) to match documented error semantics.

- Quick diagnostics endpoint: `GET /api/kling-diagnostics` shows mock mode, auth mode, key presence, URL overrides, DNS lookup, and connectivity probe result.
- You can also test from shell:
  - `curl -i "$KLING_API_BASE_URL"`
  - `curl -i "${KLING_CREATE_URL:-$KLING_API_BASE_URL/v1/videos/omni-video}"`
  If these fail with proxy/tunnel errors, your network policy or proxy is blocking Kling.
- If your Kling account uses different endpoint paths, set env overrides:
  - `KLING_CREATE_URL` (full POST URL)
  - `KLING_STATUS_URL_TEMPLATE` (must include `{jobId}` placeholder)
- If you get `404 ... /v1/videos/omni-video`, your account/model likely uses a different create endpoint path. Set `KLING_CREATE_URL` and `KLING_STATUS_URL_TEMPLATE` from the OmniVideo docs for your account region.

About `KLING_API_BASE_URL`:

- It is an API host, not a website homepage. Opening the base URL in a browser may return blank/404 and that can be normal.
- If you get `ENOTFOUND api.kling.ai`, treat it as a likely endpoint mismatch first: confirm your provider's exact API hostname/path and update `KLING_API_BASE_URL` (and overrides if needed).
- What matters is whether the specific API endpoints used by your provider docs respond correctly with auth.
