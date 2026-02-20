import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

export async function chatJson({ systemPrompt, userPrompt, mockData }) {
  if (process.env.USE_MOCK_DATA === 'true' || !client) {
    return mockData;
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty content');
  return extractJson(content);
}
