import { chatJson } from '@/lib/openai';

const SYSTEM_PROMPT = `You are a cinematic planning engine.
Return strict JSON only.
You must decompose a single user prompt into scenes and shots.
Each shot must include fields in this exact order and meaning:
subject, action, environment, camera, lighting, style, tone, duration.
Use concise professional film language.
Duration is in seconds as a number.
Output format:
{
  "scenes": [
    {
      "description": "string",
      "shots": [
        {
          "subject": "string",
          "action": "string",
          "environment": "string",
          "camera": "string",
          "lighting": "string",
          "style": "string",
          "tone": "string",
          "duration": 4
        }
      ]
    }
  ]
}`;

function buildUserPrompt(prompt) {
  return `Cinematic prompt: ${prompt}\n\nCreate 3-8 scenes with 1-4 shots per scene.`;
}

const fallback = {
  scenes: [
    {
      description: 'Opening cinematic setup',
      shots: [
        {
          subject: 'Main character',
          action: 'walks into frame with purpose',
          environment: 'dramatic city skyline at dusk',
          camera: 'wide establishing dolly-in',
          lighting: 'soft golden hour rim light',
          style: 'cinematic realistic',
          tone: 'epic hopeful',
          duration: 5
        }
      ]
    }
  ]
};

export async function parsePromptToScenes(prompt) {
  const { data, provider } = await chatJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(prompt),
    mockData: fallback
  });

  const scenes = Array.isArray(data?.scenes) ? data.scenes : [];
  if (!scenes.length) throw new Error('Prompt parser returned no scenes.');

  const normalized = scenes.map((scene) => ({
    description: String(scene.description || 'Scene'),
    shots: (Array.isArray(scene.shots) ? scene.shots : []).map((shot) => ({
      subject: String(shot.subject || ''),
      action: String(shot.action || ''),
      environment: String(shot.environment || ''),
      camera: String(shot.camera || ''),
      lighting: String(shot.lighting || ''),
      style: String(shot.style || ''),
      tone: String(shot.tone || ''),
      duration: Math.max(2, Math.min(12, Number(shot.duration || 4)))
    }))
  }));

  return { scenes: normalized, provider };
}
