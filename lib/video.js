import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, { stdio: 'pipe' });

    let stderr = '';
    ffmpeg.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
    });
  });
}

export async function mergeVideos(scenePaths, outputPath) {
  if (!scenePaths.length) {
    throw new Error('No scene videos to merge');
  }

  const listPath = path.join(path.dirname(outputPath), 'concat-list.txt');
  const listContent = scenePaths.map((file) => `file '${path.resolve(file)}'`).join('\n');
  await fs.writeFile(listPath, listContent);

  try {
    await runFfmpeg([
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c',
      'copy',
      outputPath
    ]);
  } catch (error) {
    // Fallback re-encode path for inputs with mismatched codecs.
    await runFfmpeg([
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      outputPath
    ]);
  }

  return outputPath;
}
