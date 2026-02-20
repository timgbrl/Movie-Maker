import fs from 'node:fs/promises';
import path from 'node:path';

async function writePlaceholderVideo(filePath, sceneNumber) {
  // Placeholder file so local flow remains testable without external API.
  await fs.writeFile(filePath, `PLACEHOLDER_VIDEO_SCENE_${sceneNumber}`);
}

export async function generateSceneVideo({ scene, references = {}, outputDir }) {
  const safeFileName = `scene-${scene.sceneNumber}.mp4`;
  const outputPath = path.join(outputDir, safeFileName);

  if (process.env.USE_MOCK_DATA === 'true' || !process.env.KLING_API_KEY) {
    await writePlaceholderVideo(outputPath, scene.sceneNumber);
    return { sceneNumber: scene.sceneNumber, outputPath, provider: 'mock' };
  }

  const payload = {
    model: process.env.KLING_MODEL || 'kling-v3',
    prompt: scene.klingPrompt,
    multishot: scene.multishot,
    references
  };

  const createRes = await fetch(`${process.env.KLING_API_BASE_URL}/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KLING_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!createRes.ok) {
    throw new Error(`Kling create request failed: ${createRes.status}`);
  }

  const { jobId, videoUrl } = await createRes.json();
  const finalVideoUrl = videoUrl || (await pollKlingVideo(jobId));

  const videoRes = await fetch(finalVideoUrl);
  if (!videoRes.ok) {
    throw new Error(`Kling download failed: ${videoRes.status}`);
  }

  const arr = await videoRes.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(arr));
  return { sceneNumber: scene.sceneNumber, outputPath, provider: 'kling' };
}

async function pollKlingVideo(jobId, retries = 30) {
  for (let i = 0; i < retries; i += 1) {
    const statusRes = await fetch(`${process.env.KLING_API_BASE_URL}/videos/${jobId}`, {
      headers: { Authorization: `Bearer ${process.env.KLING_API_KEY}` }
    });

    if (!statusRes.ok) {
      throw new Error(`Kling status failed: ${statusRes.status}`);
    }

    const json = await statusRes.json();
    if (json.status === 'succeeded' && json.videoUrl) {
      return json.videoUrl;
    }

    if (json.status === 'failed') {
      throw new Error(`Kling job failed for ${jobId}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  throw new Error(`Kling job timed out for ${jobId}`);
}
