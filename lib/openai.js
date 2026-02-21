import OpenAI from 'openai';

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

function isTruthy(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function shouldUseMockData() {
  return isTruthy(process.env.USE_MOCK_DATA);
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function chatJson({ systemPrompt, userPrompt, mockData }) {
  const client = getOpenAIClient();

  if (shouldUseMockData() || !client) {
    return { data: mockData, provider: 'mock' };
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

  return { data: extractJson(content), provider: 'openai' };
}

export { shouldUseMockData };
