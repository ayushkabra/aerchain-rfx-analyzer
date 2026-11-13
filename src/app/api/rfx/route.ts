import { NextResponse } from 'next/server';
import { getCanonicalRFx } from '@/lib/rfx';

export async function GET() {
  try {
    const rfx = getCanonicalRFx();
    return NextResponse.json({ success: true, data: rfx });
  } catch (error: any) {
    console.error('Failed to load RFx:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load canonical RFx' },
      { status: 500 }
    );
  }
}
