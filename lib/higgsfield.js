const HIGGSFIELD_BASE_URL = 'https://api.higgsfield.ai/v1';

function getApiKey() {
  const key = process.env.HIGGSFIELD_API_KEY?.trim();
  if (!key) throw new Error('HIGGSFIELD_API_KEY is missing.');
  return key;
}

async function requestJson(url, options = {}, label = 'Higgsfield request') {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`${label} returned non-JSON response (${response.status}): ${raw.slice(0, 400)}`);
    }
  }

  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${JSON.stringify(data).slice(0, 600)}`);
  }

  return data;
}

export async function createVideoTask(payload) {
  return requestJson(`${HIGGSFIELD_BASE_URL}/videos/generate`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 'Higgsfield create task');
}

export async function getVideoStatus(taskId) {
  return requestJson(`${HIGGSFIELD_BASE_URL}/videos/${encodeURIComponent(taskId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }, 'Higgsfield get status');
}
