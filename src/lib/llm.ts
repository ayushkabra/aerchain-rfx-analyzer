export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  jsonMode?: boolean;
  temperature?: number;
}

export interface LLMVisionOptions {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  imageMimeType?: string;
  model?: string;
}

// Groq configuration
function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
  const isGroq = !!process.env.GROQ_API_KEY;
  const baseUrl = isGroq ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1';
  
  // Default text model: use env var first, or reliable Groq fallback
  const defaultTextModel = process.env.TEXT_MODEL || 'openai/gpt-oss-20b';
  
  // Default vision model: use env var first, or reliable Groq fallback
  const defaultVisionModel = process.env.VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

  return { apiKey, baseUrl, defaultTextModel, defaultVisionModel, isGroq };
}

export async function listAvailableGroqModels(): Promise<{ id: string; active?: boolean }[]> {
  const { apiKey, baseUrl } = getGroqConfig();
  if (!apiKey) return [];

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error('Failed to list models:', e);
    return [];
  }
}

export async function callLLMText(options: LLMCallOptions): Promise<string> {
  const { apiKey, baseUrl, defaultTextModel, isGroq } = getGroqConfig();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env.local. Please add your Groq API key.');
  }

  const model = options.model || defaultTextModel;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (!isGroq) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'Aerchain RFx Analyzer';
  }

  const body: any = {
    model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt }
    ],
    temperature: options.temperature ?? 0.1,
  };

  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let parsedMessage = errorText;
    let errorCode = '';
    try {
      const errJson = JSON.parse(errorText);
      parsedMessage = errJson.error?.message || errJson.message || errorText;
      errorCode = errJson.error?.code || '';
    } catch {
      // ignore
    }

    if (res.status === 429) {
      throw new Error(`Rate limit reached (429): ${parsedMessage}`);
    }

    if (res.status === 404 || errorCode === 'model_not_found') {
      throw new Error(`Model '${model}' not found (404): ${parsedMessage}`);
    }

    throw new Error(`LLM API error (${res.status}): ${parsedMessage}`);
  }

  const json = await res.json();
  const choice = json.choices?.[0];
  if (!choice || !choice.message?.content) {
    throw new Error('No content returned from LLM model');
  }

  return choice.message.content.trim();
}

export async function callLLMVision(options: LLMVisionOptions): Promise<string> {
  const { apiKey, baseUrl, defaultVisionModel, isGroq } = getGroqConfig();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env.local. Please add your Groq API key.');
  }

  const model = options.model || defaultVisionModel;
  const mime = options.imageMimeType || 'image/jpeg';
  const dataUrl = options.imageBase64.startsWith('data:') 
    ? options.imageBase64 
    : `data:${mime};base64,${options.imageBase64}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (!isGroq) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'Aerchain RFx Analyzer';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: options.systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: options.userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`LLM Vision API error (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  const choice = json.choices?.[0];
  return choice?.message?.content?.trim() || '';
}

export const callOpenRouterText = callLLMText;
export const callOpenRouterVision = callLLMVision;
