import fs from 'node:fs/promises';
import path from 'node:path';
import dns from 'node:dns/promises';
import { spawn } from 'node:child_process';
import { Agent, ProxyAgent } from 'undici';
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

function getCreateUrl(baseUrl) {
  return (process.env.KLING_CREATE_URL || `${baseUrl}/videos`).trim();
}

function getStatusUrl(baseUrl, jobId) {
  const template = (process.env.KLING_STATUS_URL_TEMPLATE || `${baseUrl}/videos/{jobId}`).trim();
  return template.replace('{jobId}', encodeURIComponent(jobId));
}

function getProxyUrl() {
  return process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || '';
}

function getDispatcher() {
  const proxyUrl = getProxyUrl();

  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }

  // For Windows + some networks, forcing IPv4 first avoids intermittent undici fetch failures.
  return new Agent({ connect: { family: 4 } });
}

function buildNetworkHint(message = '', url = '') {
  const lower = message.toLowerCase();
  if (lower.includes('enotfound')) {
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      host = '';
    }

    if (host === 'api.kling.ai') {
      return 'DNS lookup failed for api.kling.ai. This hostname may be incorrect for your Kling account; verify the exact API base URL from your provider docs and update KLING_API_BASE_URL.';
    }

    return `DNS lookup failed for KLING_API_BASE_URL host${host ? ` (${host})` : ''}. Verify the domain spelling and provider endpoint docs.`;
  }
  if (lower.includes('econnrefused')) return 'Connection refused by remote host or proxy.';
  if (lower.includes('self signed certificate') || lower.includes('certificate')) {
    return 'TLS/certificate issue between your environment and Kling endpoint.';
  }
  if (lower.includes('proxy') || lower.includes('tunnel')) {
    return 'Proxy tunnel blocked request. Check HTTPS_PROXY/HTTP_PROXY or network policy.';
  }
  if (lower.includes('etimedout') || lower.includes('abort')) {
    return 'Network timeout. Verify firewall/egress rules and endpoint reachability.';
  }
  return 'Check KLING_API_BASE_URL, network egress, and proxy configuration.';
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      dispatcher: getDispatcher()
    });
  } catch (error) {
    const causeMessage = error?.cause?.message ? ` Cause: ${error.cause.message}` : '';
    const causeCode = error?.cause?.code ? ` CauseCode: ${error.cause.code}` : '';
    const hint = buildNetworkHint(`${error?.message || ''} ${error?.cause?.message || ''}`, url);
    throw new Error(`Network error for ${url}: ${error.message}.${causeCode}${causeMessage} Hint: ${hint}`);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options, label) {
  const res = await fetchWithTimeout(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${label} failed (${res.status}) at ${url}: ${body.slice(0, 500)}`);
  }

  try {
    return await res.json();
  } catch (error) {
    throw new Error(`${label} returned non-JSON response at ${url}: ${error.message}`);
  }
}

export async function klingConnectivityCheck() {
  const baseUrl = getKlingBaseUrl();
  if (!baseUrl) {
    return { ok: false, reason: 'KLING_API_BASE_URL missing' };
  }

  let dnsLookup = null;
  try {
    const host = new URL(baseUrl).hostname;
    dnsLookup = await dns.lookup(host, { all: true });
  } catch (error) {
    dnsLookup = { error: error.message };
  }

  try {
    const res = await fetchWithTimeout(baseUrl, { method: 'GET' }, 10000);
    return {
      ok: true,
      url: baseUrl,
      status: res.status,
      dnsLookup,
      proxyConfigured: Boolean(getProxyUrl())
    };
  } catch (error) {
    return {
      ok: false,
      url: baseUrl,
      reason: error.message,
      dnsLookup,
      proxyConfigured: Boolean(getProxyUrl())
    };
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

  const createUrl = getCreateUrl(baseUrl);
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
  if (!jobId && !videoUrl) {
    throw new Error(`Kling create response missing both jobId and videoUrl at ${createUrl}`);
  }

  const finalVideoUrl = videoUrl || (await pollKlingVideo(jobId));

  const videoRes = await fetchWithTimeout(finalVideoUrl, {}, 45000);
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
    const statusUrl = getStatusUrl(baseUrl, jobId);
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
