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
  - Add `KLING_API_KEY` and `KLING_API_BASE_URL`
- Kling integration is implemented as a REST stub with create + poll + download behavior.

## Where files are saved

- Scene clips and final movie are stored under `app/output/<movieId>/`.
- Final merged output is `app/output/<movieId>/final-movie.mp4`.
- The render API response includes this path in `savedTo`, and the UI also displays it.

## ffmpeg requirement

`/api/render-movie` uses ffmpeg to generate mock scene clips and to merge scenes. Install ffmpeg on your machine.

## Deterministic prompts

Prompt templates are in `lib/prompts.js` and request JSON-only outputs with fixed schema.
