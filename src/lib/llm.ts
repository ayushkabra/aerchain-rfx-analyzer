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
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(new RegExp(`^${key}\\s*=\\s*([^\\r\\n#]+)`, 'm'));
      if (match) return match[1].trim();
    }
  } catch {}
  return undefined;
}

// Groq configuration
function getGroqConfig() {
  const apiKey = getEnv('GROQ_API_KEY') || getEnv('OPENROUTER_API_KEY');
  const isGroq = !!getEnv('GROQ_API_KEY');
  const baseUrl = isGroq ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1';
  
  // Default text model: use env var first, or reliable Groq fallback
  const defaultTextModel = getEnv('TEXT_MODEL') || 'openai/gpt-oss-20b';
  
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
      const openRouterKey = getEnv('OPENROUTER_API_KEY');
      if (openRouterKey) {
        console.warn('Groq rate limit (429) hit. Seamlessly routing to OpenRouter...');
        try {
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Aerchain RFx Analyzer',
            },
            body: JSON.stringify({
              ...body,
              model: 'meta-llama/llama-3.3-70b-instruct',
            }),
          });
          if (orRes.ok) {
            const orJson = await orRes.json();
            const orChoice = orJson.choices?.[0];
            if (orChoice?.message?.content) {
              return orChoice.message.content.trim();
            }
          }
        } catch (orErr) {
          console.error('OpenRouter fallback failed:', orErr);
        }
      }

      console.warn(`Rate limit reached (429). Waiting 15 seconds before retrying...`);
      await new Promise(r => setTimeout(r, 15000));
      const retryRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (retryRes.ok) {
        const retryJson = await retryRes.json();
        const retryChoice = retryJson.choices?.[0];
        if (retryChoice?.message?.content) {
          return retryChoice.message.content.trim();
        }
      }
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
  const openRouterKey = getEnv('OPENROUTER_API_KEY');
  const groqKey = getEnv('GROQ_API_KEY');
  
  // Use OpenRouter if configured, otherwise Groq
  const useOpenRouter = !!openRouterKey;
  const apiKey = useOpenRouter ? openRouterKey : groqKey;
  const baseUrl = useOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.groq.com/openai/v1';
  const defaultVisionModel = getEnv('VISION_MODEL') || (useOpenRouter ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.2-11b-vision-preview');

  if (!apiKey) {
    throw new Error('Neither OPENROUTER_API_KEY nor GROQ_API_KEY is configured in .env.local.');
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

  if (useOpenRouter) {
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
