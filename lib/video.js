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

    ffmpeg.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error('ffmpeg is not installed or not in PATH. Install ffmpeg to enable final movie stitching.'));
        return;
      }
      reject(new Error(`ffmpeg failed to start: ${error.message}`));
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
    });
  });
}

export async function mergeVideos(scenePaths, outputPath) {
  if (!scenePaths.length) throw new Error('No scene videos to merge.');

  const workDir = path.dirname(outputPath);
  const normalizedPaths = [];

  for (let i = 0; i < scenePaths.length; i += 1) {
    const input = scenePaths[i];
    const normalized = path.join(workDir, `normalized-${i + 1}.mp4`);
    await runFfmpeg([
      '-y',
      '-i',
      input,
      '-vf',
      'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
      '-r',
      '24',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-ar',
      '48000',
      '-movflags',
      '+faststart',
      normalized
    ]);
    normalizedPaths.push(normalized);
  }

  const listPath = path.join(workDir, 'concat-list.txt');
  await fs.writeFile(listPath, normalizedPaths.map((file) => `file '${path.resolve(file)}'`).join('\n'));

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

  return outputPath;
}
