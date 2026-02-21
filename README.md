# Movie Maker (Higgsfield)

Single-prompt cinematic movie generator powered by OpenAI + Higgsfield.

## Environment

Create `.env.local`:

```bash
VIDEO_PROVIDER=higgsfield
HIGGSFIELD_API_KEY=your_key
HIGGSFIELD_SECRET_KEY=your_secret
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
USE_MOCK_DATA=false
```

## Run

```bash
npm install
npm run dev
```

## API

### `POST /api/generate-video`
Starts generation from a single cinematic prompt.

Body:

```json
{ "prompt": "A lone detective in rain-soaked neon Tokyo..." }
```

Returns movie id and per-scene Higgsfield task ids.

### `GET /api/generate-video?movieId=<id>`
Polls all scene tasks, downloads completed clips, stitches final movie with ffmpeg, and returns final URLs when complete.

## Architecture

- `lib/promptParser.js` – Decomposes user prompt into scenes and shots using OpenAI.
- `lib/higgsfield.js` – Higgsfield API client (`createVideoTask`, `getVideoStatus`).
- `lib/videoProvider.js` – Provider abstraction exporting `generateMovieFromPrompt(prompt)`; uses Higgsfield only.
- `lib/video.js` – FFmpeg normalization + concatenation.
- `app/api/generate-video/route.js` – async task orchestration + polling.

## Notes

- Scene requests are sent as Higgsfield multishot payloads.
- Higgsfield requests require both `HIGGSFIELD_API_KEY` and `HIGGSFIELD_SECRET_KEY`.
- Aspect ratio is fixed at `16:9` and `cinematic_mode=true`.
- If ffmpeg is missing, API returns a clear error instructing installation.
