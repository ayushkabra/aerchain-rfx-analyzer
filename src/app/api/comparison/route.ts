import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalRFx } from '@/lib/rfx';
import { getAllVendors } from '@/lib/vendors';
import { normalizeVendorQuotes } from '@/lib/normalization';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fxRate = parseFloat(searchParams.get('fxRate') || '85.0');

    const rfx = getCanonicalRFx();
    const vendors = await getAllVendors(rfx);

    const comparison = normalizeVendorQuotes(rfx, vendors, {
      fxRateUSDToINR: fxRate,
    });

    return NextResponse.json({
      success: true,
      data: comparison,
      vendorsCount: vendors.length,
    });
  } catch (error: any) {
    console.error('Comparison error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to compute comparison matrix' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fxRate = typeof body.fxRate === 'number' ? body.fxRate : 85.0;
    const overrides = body.manualOverrides || {};

    const rfx = getCanonicalRFx();
    const vendors = await getAllVendors(rfx);

    const comparison = normalizeVendorQuotes(rfx, vendors, {
      fxRateUSDToINR: fxRate,
      manualOverrides: overrides,
    });

    return NextResponse.json({
      success: true,
      data: comparison,
      vendorsCount: vendors.length,
    });
  } catch (error: any) {
    console.error('Comparison calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to recalculate comparison' },
      { status: 500 }
    );
  }
}
