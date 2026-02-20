import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

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

export async function generateSceneVideo({ scene, references = {}, outputDir }) {
  const safeFileName = `scene-${scene.sceneNumber}.mp4`;
  const outputPath = path.join(outputDir, safeFileName);

  if (process.env.USE_MOCK_DATA === 'true' || !process.env.KLING_API_KEY) {
    await writeMockVideo(outputPath, scene);
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
