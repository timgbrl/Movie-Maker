export const IDEA_SYSTEM_PROMPT = `You are a senior film development AI. Return deterministic structured output.`;

export const IDEA_USER_PROMPT_TEMPLATE = `Given the user prompt and desired runtime, generate exactly 3 distinct movie concepts.

Input:
- user_prompt: "{{USER_PROMPT}}"
- runtime_seconds: {{RUNTIME_SECONDS}}

Return JSON only with this exact shape:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "string",
      "synopsis": "string",
      "tone": "string",
      "roughScenes": [
        {"scene": 1, "summary": "string"}
      ],
      "suggestedCharacters": ["string"],
      "suggestedLocations": ["string"]
    }
  ]
}

Rules:
- Provide exactly 3 ideas.
- roughScenes length must be between 3 and 6.
- suggestedCharacters should be 2 to 5 names.
- suggestedLocations should be 1 to 3 names.
- Keep ideas clearly distinct in setting and tone.
- Do not include markdown.
- Output valid JSON only.`;

export const SCENE_SYSTEM_PROMPT = `You are a production planning AI. Return deterministic structured JSON only.`;

export const SCENE_USER_PROMPT_TEMPLATE = `Create a final scene plan and Kling prompts.

Input JSON:
{{INPUT_JSON}}

Return JSON only with this exact shape:
{
  "title": "string",
  "genre": "string",
  "runtimeSeconds": 120,
  "scriptSummary": "string",
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneTitle": "string",
      "durationSeconds": 20,
      "characters": ["string"],
      "location": "string",
      "camera": "string",
      "action": "string",
      "wardrobe": "string",
      "mood": "string",
      "multishot": true,
      "klingPrompt": "string"
    }
  ]
}

Rules:
- Duration total should closely match runtimeSeconds.
- scene count should be between 3 and 10.
- Include one Kling prompt per scene.
- Prompts must include camera, action, characters, wardrobe, location, mood, and shot duration.
- Prefer multishot=true when scene has multiple beats.
- No markdown.
- Output valid JSON only.`;
