import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { shouldUseMockData } from '@/lib/openai';

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'pipe' });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`${command} failed to start: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} exited with code ${code}: ${stderr}`));
    });
  });
}

async function writeMockVideo(filePath, scene) {
  // We generate a real MP4 in mock mode so ffmpeg concat works end-to-end.
  const duration = Math.max(2, Math.min(8, Number(scene.durationSeconds || 3)));

  await runCommand('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x111827:s=1280x720:d=${duration}`,
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=48000:cl=stereo',
    '-shortest',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    filePath
  ]);

  const metaPath = filePath.replace('.mp4', '.json');
  await fs.writeFile(
    metaPath,
    JSON.stringify(
      {
        provider: 'mock',
        sceneNumber: scene.sceneNumber,
        prompt: scene.klingPrompt,
        note: 'Mock MP4 generated via ffmpeg color source.'
      },
      null,
      2
    )
  );
}

function getKlingBaseUrl() {
  return (process.env.KLING_API_BASE_URL || '').trim().replace(/\/$/, '');
}

async function fetchJson(url, options, label) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${label} failed (${res.status}) at ${url}: ${body.slice(0, 500)}`);
    }
    return res.json();
  } catch (error) {
    throw new Error(`${label} network/request error at ${url}: ${error.message}`);
  }
}

export async function generateSceneVideo({ scene, references = {}, outputDir }) {
  const safeFileName = `scene-${scene.sceneNumber}.mp4`;
  const outputPath = path.join(outputDir, safeFileName);

  if (shouldUseMockData() || !process.env.KLING_API_KEY?.trim()) {
    await writeMockVideo(outputPath, scene);
    return { sceneNumber: scene.sceneNumber, outputPath, provider: 'mock' };
  }

  const baseUrl = getKlingBaseUrl();
  if (!baseUrl) {
    throw new Error('KLING_API_BASE_URL is missing. Set it in .env.local.');
  }

  const payload = {
    model: process.env.KLING_MODEL || 'kling-v3',
    prompt: scene.klingPrompt,
    multishot: scene.multishot,
    references
  };

  const createUrl = `${baseUrl}/videos`;
  const createJson = await fetchJson(
    createUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KLING_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    },
    'Kling create request'
  );

  const { jobId, videoUrl } = createJson;
  const finalVideoUrl = videoUrl || (await pollKlingVideo(jobId));

  let videoRes;
  try {
    videoRes = await fetch(finalVideoUrl);
  } catch (error) {
    throw new Error(`Kling video download network error at ${finalVideoUrl}: ${error.message}`);
  }

  if (!videoRes.ok) {
    const body = await videoRes.text();
    throw new Error(`Kling video download failed (${videoRes.status}) at ${finalVideoUrl}: ${body.slice(0, 500)}`);
  }

  const arr = await videoRes.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(arr));
  return { sceneNumber: scene.sceneNumber, outputPath, provider: 'kling' };
}

async function pollKlingVideo(jobId, retries = 30) {
  const baseUrl = getKlingBaseUrl();

  for (let i = 0; i < retries; i += 1) {
    const statusUrl = `${baseUrl}/videos/${jobId}`;
    const json = await fetchJson(
      statusUrl,
      {
        headers: { Authorization: `Bearer ${process.env.KLING_API_KEY}` }
      },
      'Kling status request'
    );

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
