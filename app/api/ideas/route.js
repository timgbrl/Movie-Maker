import { z } from 'zod';
import { IDEA_SYSTEM_PROMPT, IDEA_USER_PROMPT_TEMPLATE } from '@/lib/prompts';
import { chatJson } from '@/lib/openai';
import { mockIdeas } from '@/lib/mock-data';

const requestSchema = z.object({
  prompt: z.string().min(10),
  runtimeSeconds: z.number().min(30).max(300).default(120)
});

export async function POST(request) {
  try {
    const parsed = requestSchema.parse(await request.json());

    const userPrompt = IDEA_USER_PROMPT_TEMPLATE.replace('{{USER_PROMPT}}', parsed.prompt).replace(
      '{{RUNTIME_SECONDS}}', String(parsed.runtimeSeconds)
    );

    const data = await chatJson({
      systemPrompt: IDEA_SYSTEM_PROMPT,
      userPrompt,
      mockData: mockIdeas
    });

    return Response.json(data, { status: 200 });
  } catch (error) {
    const message = error?.message || 'Failed to generate ideas';
    return Response.json({ error: message }, { status: 400 });
  }
}
