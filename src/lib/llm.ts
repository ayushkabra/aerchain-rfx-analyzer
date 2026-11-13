import fs from 'fs';
import path from 'path';

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

export function getEnv(key: string): string | undefined {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(new RegExp(`^${key}\\s*=\\s*([^\\r\\n#]+)`, 'm'));
      if (match) return match[1].trim();
    }
  } catch {}
  return process.env[key];
}

// Groq configuration
function getGroqConfig() {
  const apiKey = getEnv('GROQ_API_KEY') || getEnv('OPENROUTER_API_KEY');
  const isGroq = !!getEnv('GROQ_API_KEY');
  const baseUrl = isGroq ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1';
  
  // Default text model: use env var first, or available Groq model (openai/gpt-oss-120b)
  const defaultTextModel = getEnv('TEXT_MODEL') || 'openai/gpt-oss-120b';
  
  // Default vision model: use env var first, or reliable Groq fallback
  const defaultVisionModel = getEnv('VISION_MODEL') || 'meta-llama/llama-4-scout-17b-16e-instruct';

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

export async function findBestAvailableGroqTextModel(requestedModel?: string): Promise<string> {
  const models = await listAvailableGroqModels();
  const modelIds = models.map(m => m.id);

  if (requestedModel && modelIds.includes(requestedModel)) {
    return requestedModel;
  }

  const candidates = [
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'allam-2-7b',
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile'
  ];

  for (const cand of candidates) {
    if (modelIds.includes(cand)) {
      return cand;
    }
  }

  const chatModel = modelIds.find(id => !id.includes('guard') && !id.includes('whisper') && !id.includes('orpheus'));
  return chatModel || 'openai/gpt-oss-120b';
}

export async function findBestAvailableGroqVisionModel(requestedModel?: string): Promise<string> {
  const models = await listAvailableGroqModels();
  const modelIds = models.map(m => m.id);

  if (requestedModel && modelIds.includes(requestedModel)) {
    return requestedModel;
  }

  const candidates = [
    'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview',
    'llama-3.2-11b-text-preview'
  ];

  for (const cand of candidates) {
    if (modelIds.includes(cand)) {
      return cand;
    }
  }

  return 'llama-3.2-11b-vision-preview';
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
    max_tokens: 4000,
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
      if (parsedMessage.toLowerCase().includes('too large')) {
        console.warn('Request too large for current model. Falling back to qwen/qwen3.8-27b...');
        const altBody = { ...body, model: 'qwen/qwen3.8-27b', max_tokens: 3500 };
        const altRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST', headers, body: JSON.stringify(altBody),
        });
        if (altRes.ok) {
          const altJson = await altRes.json();
          const c = altJson.choices?.[0];
          if (c?.message?.content) return c.message.content.trim();
        }
      }

      const retryHeader = res.headers.get('retry-after');
      let waitSeconds = retryHeader ? parseInt(retryHeader, 10) : 0;
      if (!waitSeconds || isNaN(waitSeconds)) {
        const match = parsedMessage.match(/try again in ([0-9.]+)(s|ms)/i);
        if (match) {
          waitSeconds = match[2].toLowerCase() === 'ms'
            ? Math.ceil(parseFloat(match[1]) / 1000)
            : Math.ceil(parseFloat(match[1]));
        }
      }
      const waitTime = Math.max((waitSeconds || 25) + 3, 25);
      console.warn(`Groq rate limit (429). Waiting ${waitTime}s before retrying...`);
      await new Promise(r => setTimeout(r, waitTime * 1000));
      const retryRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      if (retryRes.ok) {
        const retryJson = await retryRes.json();
        const c = retryJson.choices?.[0];
        if (c?.message?.content) return c.message.content.trim();
      }
      if (retryRes.status === 429) {
        console.warn('Groq rate limit (429) second hit. Waiting 30s...');
        await new Promise(r => setTimeout(r, 30000));
        const retryRes2 = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        if (retryRes2.ok) {
          const retryJson2 = await retryRes2.json();
          const c2 = retryJson2.choices?.[0];
          if (c2?.message?.content) return c2.message.content.trim();
        }
        const err2 = await retryRes2.text();
        throw new Error(`Rate limit reached (429) after retry: ${err2}`);
      }
      const retryErr = await retryRes.text();
      throw new Error(`Rate limit reached (429): ${retryErr || parsedMessage}`);
    }

    if (res.status === 404 || errorCode === 'model_not_found') {
      console.warn(`Model '${model}' not found (404) on Groq. Finding best available model...`);
      const fallback = await findBestAvailableGroqTextModel();
      if (fallback && fallback !== model) {
        console.warn(`Retrying with available Groq model: '${fallback}'...`);
        const retryBody = { ...body, model: fallback };
        const retryRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(retryBody),
        });
        if (retryRes.ok) {
          const retryJson = await retryRes.json();
          const c = retryJson.choices?.[0];
          if (c?.message?.content) return c.message.content.trim();
        }
      }
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
  const apiKey = getEnv('GROQ_API_KEY') || getEnv('OPENROUTER_API_KEY');
  const useOpenRouter = !getEnv('GROQ_API_KEY') && !!getEnv('OPENROUTER_API_KEY');
  const baseUrl = useOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.groq.com/openai/v1';
  const defaultVisionModel = getEnv('VISION_MODEL') || 'meta-llama/llama-4-scout-17b-16e-instruct';

  if (!apiKey) {
    throw new Error('Neither OPENROUTER_API_KEY nor GROQ_API_KEY is configured in .env.local.');
  }

  let model = options.model || defaultVisionModel;
  if (!useOpenRouter && (model.includes('llama-4') || model.includes('scout') || model.includes('meta-llama/'))) {
    model = await findBestAvailableGroqVisionModel();
  }
  const mime = options.imageMimeType || 'image/jpeg';
  const dataUrl = options.imageBase64.startsWith('data:') 
    ? options.imageBase64 
    : `data:${mime};base64,${options.imageBase64}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (useOpenRouter) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'Aerchain RFx Analyzer';
  }

  const visionBody = {
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
    max_tokens: 8000,
  };

  let res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(visionBody),
  });

  if (res.status === 429) {
    console.warn('Groq vision rate limit (429). Waiting 25s before retry...');
    await new Promise(r => setTimeout(r, 25000));
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(visionBody),
    });
  }

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
