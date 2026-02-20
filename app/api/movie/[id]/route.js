import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET(_, { params }) {
  const filePath = path.join(process.cwd(), 'app/output', params.id, 'final-movie.mp4');

  try {
    const buffer = await fs.readFile(filePath);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${params.id}.mp4"`
      }
    });
  } catch {
    return Response.json({ error: 'Movie not found' }, { status: 404 });
  }
}
