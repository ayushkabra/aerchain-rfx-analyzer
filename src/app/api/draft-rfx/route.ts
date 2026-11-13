import { NextRequest, NextResponse } from 'next/server';
import { draftRFxWithLLM } from '@/lib/drafting';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const brief = (body.brief || '').trim();

    if (!brief) {
      return NextResponse.json(
        { success: false, error: 'A procurement brief or category description is required.' },
        { status: 400 }
      );
    }

    const draftedRfx = await draftRFxWithLLM(brief);

    return NextResponse.json({
      success: true,
      data: draftedRfx,
    });
  } catch (error: any) {
    console.error('RFx Drafting Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to draft RFx' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brief = searchParams.get('brief') || 'Draft an RFx for direct-to-consumer apparel packaging';
    const draftedRfx = await draftRFxWithLLM(brief);

    return NextResponse.json({
      success: true,
      data: draftedRfx,
    });
  } catch (error: any) {
    console.error('RFx Drafting GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to draft RFx' },
      { status: 500 }
    );
  }
}

