import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { generateMovieFromPrompt } from '@/lib/videoProvider';
import { getVideoStatus } from '@/lib/higgsfield';
import { mergeVideos } from '@/lib/video';

const requestSchema = z.object({
  prompt: z.string().min(5)
});

const jobs = globalThis.__movieJobs || new Map();
globalThis.__movieJobs = jobs;

function pickStatus(data) {
  return data?.status || data?.task_status || data?.data?.status || data?.data?.task_status || 'processing';
}

function pickVideoUrl(data) {
  return data?.videoUrl || data?.video_url || data?.data?.videoUrl || data?.data?.video_url || data?.data?.url || null;
}

function isDone(status) {
  return ['succeeded', 'success', 'completed', 'done'].includes(String(status).toLowerCase());
}

function isFailed(status) {
  return ['failed', 'error', 'canceled', 'cancelled'].includes(String(status).toLowerCase());
}

async function downloadToFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to download scene video (${response.status}): ${body.slice(0, 300)}`);
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, fileBuffer);
}

export async function POST(request) {
  try {
    const { prompt } = requestSchema.parse(await request.json());
    const movieId = crypto.randomUUID();
    const baseDir = path.join(process.cwd(), 'app/output', movieId);
    await fs.mkdir(baseDir, { recursive: true });

    const generated = await generateMovieFromPrompt(prompt);

    jobs.set(movieId, {
      movieId,
      prompt,
      baseDir,
      createdAt: Date.now(),
      parserProvider: generated.parserProvider,
      videoProvider: generated.videoProvider,
      scenes: generated.scenes,
      tasks: generated.tasks,
      finalPath: null,
      status: 'processing'
    });

    return Response.json({
      movieId,
      status: 'processing',
      parserProvider: generated.parserProvider,
      videoProvider: generated.videoProvider,
      tasks: generated.tasks.map((task) => ({
        sceneIndex: task.sceneIndex,
        sceneDescription: task.sceneDescription,
        taskId: task.taskId,
        status: task.status
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to start generation' }, { status: 400 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get('movieId');
  if (!movieId) {
    return Response.json({ error: 'movieId is required' }, { status: 400 });
  }

  const job = jobs.get(movieId);
  if (!job) {
    return Response.json({ error: 'Movie job not found' }, { status: 404 });
  }

  if (job.status === 'complete' && job.finalPath) {
    return Response.json({
      movieId,
      status: 'complete',
      previewUrl: `/api/movie/${movieId}`,
      downloadUrl: `/api/movie/${movieId}`,
      savedTo: `app/output/${movieId}/final-movie.mp4`,
      sceneStatuses: job.tasks.map((task) => ({
        sceneIndex: task.sceneIndex,
        sceneDescription: task.sceneDescription,
        taskId: task.taskId,
        status: task.status,
        videoUrl: task.videoUrl
      }))
    });
  }

  for (const task of job.tasks) {
    if (isDone(task.status) || isFailed(task.status)) continue;
    const statusRes = await getVideoStatus(task.taskId);
    const status = pickStatus(statusRes);
    const videoUrl = pickVideoUrl(statusRes);
    task.status = status;
    task.videoUrl = videoUrl || task.videoUrl;
    console.log(`[higgsfield] poll task ${task.taskId}:`, status, videoUrl || 'no-url-yet');
  }

  if (job.tasks.some((task) => isFailed(task.status))) {
    job.status = 'failed';
    return Response.json({
      movieId,
      status: 'failed',
      sceneStatuses: job.tasks
    }, { status: 400 });
  }

  if (job.tasks.every((task) => isDone(task.status) && task.videoUrl)) {
    const scenePaths = [];
    for (const task of job.tasks) {
      const outPath = path.join(job.baseDir, `scene-${task.sceneIndex + 1}.mp4`);
      await downloadToFile(task.videoUrl, outPath);
      scenePaths.push(outPath);
    }

    const finalPath = path.join(job.baseDir, 'final-movie.mp4');
    try {
      await mergeVideos(scenePaths, finalPath);
    } catch (error) {
      return Response.json({
        error: error.message
      }, { status: 500 });
    }

    job.finalPath = finalPath;
    job.status = 'complete';

    return Response.json({
      movieId,
      status: 'complete',
      previewUrl: `/api/movie/${movieId}`,
      downloadUrl: `/api/movie/${movieId}`,
      savedTo: `app/output/${movieId}/final-movie.mp4`,
      sceneStatuses: job.tasks
    });
  }

  return Response.json({
    movieId,
    status: 'processing',
    sceneStatuses: job.tasks.map((task) => ({
      sceneIndex: task.sceneIndex,
      sceneDescription: task.sceneDescription,
      taskId: task.taskId,
      status: task.status
    }))
  });
}
