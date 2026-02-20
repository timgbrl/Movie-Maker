import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { generateSceneVideo } from '@/lib/kling';
import { mergeVideos } from '@/lib/video';

const requestSchema = z.object({
  moviePlan: z.object({
    title: z.string(),
    scenes: z.array(
      z.object({
        sceneNumber: z.number(),
        klingPrompt: z.string(),
        multishot: z.boolean(),
        durationSeconds: z.number().optional()
      })
    )
  }),
  references: z
    .object({
      characters: z.record(z.string()).optional(),
      actors: z.record(z.string()).optional(),
      wardrobe: z.record(z.string()).optional(),
      locations: z.record(z.string()).optional()
    })
    .optional()
    .default({})
});

export async function POST(request) {
  try {
    const parsed = requestSchema.parse(await request.json());
    const movieId = crypto.randomUUID();
    const baseDir = path.join(process.cwd(), 'app/output', movieId);
    await fs.mkdir(baseDir, { recursive: true });

    const sceneVideos = [];

    for (const scene of parsed.moviePlan.scenes.sort((a, b) => a.sceneNumber - b.sceneNumber)) {
      const generated = await generateSceneVideo({
        scene,
        references: parsed.references,
        outputDir: baseDir
      });
      sceneVideos.push(generated);
    }

    const finalPath = path.join(baseDir, 'final-movie.mp4');
    await mergeVideos(
      sceneVideos.map((item) => item.outputPath),
      finalPath
    );

    return Response.json({
      movieId,
      title: parsed.moviePlan.title,
      sceneCount: sceneVideos.length,
      downloadUrl: `/api/movie/${movieId}`,
      previewUrl: `/api/movie/${movieId}`,
      savedTo: `app/output/${movieId}/final-movie.mp4`,
      videoProvider: sceneVideos.every((v) => v.provider === 'kling') ? 'kling' : 'mock'
    });
  } catch (error) {
    const message = error?.message || 'Failed to render movie';
    return Response.json({ error: message }, { status: 400 });
  }
}
