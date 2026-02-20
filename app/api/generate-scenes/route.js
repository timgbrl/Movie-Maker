import { z } from 'zod';
import { SCENE_SYSTEM_PROMPT, SCENE_USER_PROMPT_TEMPLATE } from '@/lib/prompts';
import { chatJson } from '@/lib/openai';
import { mockScenePlan } from '@/lib/mock-data';

const customizationSchema = z.object({
  selectedIdea: z.object({
    id: z.string(),
    title: z.string(),
    synopsis: z.string(),
    tone: z.string()
  }),
  characters: z.array(z.object({ name: z.string(), actor: z.string() })).max(5),
  locations: z.array(z.string()).max(3),
  genre: z.string(),
  runtimeSeconds: z.number().min(30).max(300),
  overrides: z.string().optional().default('')
});

export async function POST(request) {
  try {
    const parsed = customizationSchema.parse(await request.json());

    const inputJson = JSON.stringify(parsed, null, 2);
    const userPrompt = SCENE_USER_PROMPT_TEMPLATE.replace('{{INPUT_JSON}}', inputJson);

    const data = await chatJson({
      systemPrompt: SCENE_SYSTEM_PROMPT,
      userPrompt,
      mockData: mockScenePlan
    });

    return Response.json(data, { status: 200 });
  } catch (error) {
    const message = error?.message || 'Failed to generate scenes';
    return Response.json({ error: message }, { status: 400 });
  }
}
