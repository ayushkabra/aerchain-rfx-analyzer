import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalRFx } from '@/lib/rfx';
import { loadVendorFromCache } from '@/lib/cache';
import { getSingleVendor, getAllVendors, VENDOR_IDS } from '@/lib/vendors';
import { VendorResponse } from '@/types/schema';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get('vendorId') || 'vendor1_shakti';

  if (vendorId === 'all') {
    const responses: Record<string, VendorResponse | null> = {};
    VENDOR_IDS.forEach(id => {
      responses[id] = loadVendorFromCache(id);
    });
    return NextResponse.json({ success: true, data: responses });
  }

  const cached = loadVendorFromCache(vendorId);
  return NextResponse.json({
    success: true,
    data: cached,
    isCached: !!cached,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const vendorId = body.vendorId || 'vendor1_shakti';
    const forceLive = !!body.forceLive;

    const rfx = getCanonicalRFx();

    if (vendorId === 'all') {
      const vendorList = await getAllVendors(rfx);
      const responses: Record<string, VendorResponse> = {};
      vendorList.forEach(v => {
        responses[v.vendorId] = v;
      });

      return NextResponse.json({
        success: true,
        data: responses,
        count: Object.keys(responses).length,
      });
    }

    const response = await getSingleVendor(vendorId, rfx, forceLive);

    return NextResponse.json({
      success: true,
      data: response,
      isCached: false,
    });
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Extraction failed',
        details: error.stack
      },
      { status: 500 }
    );
  }
}
