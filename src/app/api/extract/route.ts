import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getCanonicalRFx } from '@/lib/rfx';
import { loadVendorFromCache, saveVendorToCache } from '@/lib/cache';
import { parseShaktiExcel } from '@/lib/parsers/shakti-excel';
import { parseEverestPDF } from '@/lib/parsers/everest-pdf';
import { parseMetroWord } from '@/lib/parsers/metro-word';
import { parseRajdhaniVision } from '@/lib/parsers/rajdhani-vision';
import { parseGuptaEmail } from '@/lib/parsers/gupta-email';
import { VendorResponse } from '@/types/schema';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get('vendorId') || 'vendor1_shakti';

  if (vendorId === 'all') {
    const vendorIds = ['vendor1_shakti', 'vendor2_everest', 'vendor3_metro', 'vendor4_rajdhani', 'vendor5_gupta'];
    const responses: Record<string, VendorResponse | null> = {};
    vendorIds.forEach(id => {
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

    // Helper to get or extract vendor
    const getOrExtractVendor = async (id: string): Promise<VendorResponse> => {
      if (!forceLive) {
        const cached = loadVendorFromCache(id);
        if (cached) return cached;
      }

      let response: VendorResponse;

      if (id === 'vendor1_shakti') {
        const excelPath = path.join(process.cwd(), 'data', 'vendors', 'vendor1_shakti_packaging.xlsx');
        response = parseShaktiExcel(excelPath, rfx);
      } else if (id === 'vendor2_everest') {
        response = await parseEverestPDF(rfx, forceLive);
      } else if (id === 'vendor3_metro') {
        response = await parseMetroWord(rfx, forceLive);
      } else if (id === 'vendor4_rajdhani') {
        response = await parseRajdhaniVision(rfx, forceLive);
      } else if (id === 'vendor5_gupta') {
        response = await parseGuptaEmail(rfx);
      } else {
        throw new Error(`Unknown vendorId: ${id}`);
      }

      saveVendorToCache(response);
      return response;
    };

    if (vendorId === 'all') {
      const vendorIds = ['vendor1_shakti', 'vendor2_everest', 'vendor3_metro', 'vendor4_rajdhani', 'vendor5_gupta'];
      const responses: Record<string, VendorResponse> = {};

      for (const id of vendorIds) {
        try {
          responses[id] = await getOrExtractVendor(id);
        } catch (err: any) {
          console.error(`Error extracting ${id}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        data: responses,
        count: Object.keys(responses).length,
      });
    }

    const response = await getOrExtractVendor(vendorId);

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
