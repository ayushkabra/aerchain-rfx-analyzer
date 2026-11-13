import { NextResponse } from 'next/server';
import { listAvailableGroqModels, getEnv } from '@/lib/llm';

export async function GET() {
  try {
    const models = await listAvailableGroqModels();
    return NextResponse.json({
      success: true,
      provider: getEnv('GROQ_API_KEY') ? 'Groq' : 'OpenRouter',
      models: models.map(m => m.id),
      allModelsString: models.map(m => m.id).join('\n'),
      llamaModels: models.map(m => m.id).filter(id => id.toLowerCase().includes('llama')),
      currentTextModel: getEnv('TEXT_MODEL') || 'openai/gpt-oss-20b',
      currentVisionModel: getEnv('VISION_MODEL') || 'meta-llama/llama-4-scout-17b-16e-instruct',
      hasOpenRouterKey: !!getEnv('OPENROUTER_API_KEY'),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list models' },
      { status: 500 }
    );
  }
}
