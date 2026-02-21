import { parsePromptToScenes } from '@/lib/promptParser';
import { createVideoTask } from '@/lib/higgsfield';

function buildShotText(shot) {
  return [
    shot.subject,
    shot.action,
    shot.environment,
    shot.camera,
    shot.lighting,
    shot.style,
    shot.tone
  ].join(' | ');
}

function buildScenePayload(scene) {
  const styleAnchor = scene.shots[0]?.style || 'cinematic realistic';
  return {
    prompt: scene.description,
    multishot: scene.shots.map((shot) => ({
      prompt: buildShotText(shot),
      duration: Number(shot.duration)
    })),
    style_consistency: styleAnchor,
    aspect_ratio: '16:9',
    cinematic_mode: true
  };
}

function pickTaskId(data) {
  return data?.taskId || data?.task_id || data?.id || data?.data?.taskId || data?.data?.task_id || data?.data?.id || null;
}

export async function generateMovieFromPrompt(prompt) {
  const { scenes, provider: parserProvider } = await parsePromptToScenes(prompt);
  console.log('[promptParser] scenes:', JSON.stringify(scenes, null, 2));

  const tasks = [];
  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i];
    const payload = buildScenePayload(scene);
    console.log(`[higgsfield] scene ${i + 1} payload:`, JSON.stringify(payload, null, 2));

    const createRes = await createVideoTask(payload);
    const taskId = pickTaskId(createRes);
    if (!taskId) throw new Error(`Higgsfield create task missing task id for scene ${i + 1}`);

    tasks.push({
      sceneIndex: i,
      sceneDescription: scene.description,
      payload,
      taskId,
      status: 'queued',
      videoUrl: null
    });
  }

  console.log('[higgsfield] task IDs:', tasks.map((t) => t.taskId));
  return { scenes, tasks, parserProvider, videoProvider: 'higgsfield' };
}
