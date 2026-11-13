import { NextResponse } from 'next/server';
import { listAvailableGroqModels } from '@/lib/llm';

export async function GET() {
  try {
    const models = await listAvailableGroqModels();
    return NextResponse.json({
      success: true,
      provider: process.env.GROQ_API_KEY ? 'Groq' : 'OpenRouter',
      models: models.map(m => m.id),
      currentTextModel: process.env.TEXT_MODEL || 'openai/gpt-oss-20b',
      currentVisionModel: process.env.VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list models' },
      { status: 500 }
    );
  }
}
