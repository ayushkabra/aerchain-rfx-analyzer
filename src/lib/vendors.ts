import path from 'path';
import { RFx, VendorResponse } from '@/types/schema';
import { loadVendorFromCache, saveVendorToCache } from '@/lib/cache';
import { parseShaktiExcel } from '@/lib/parsers/shakti-excel';
import { parseEverestPDF } from '@/lib/parsers/everest-pdf';
import { parseMetroWord } from '@/lib/parsers/metro-word';
import { parseRajdhaniVision } from '@/lib/parsers/rajdhani-vision';
import { parseGuptaEmail } from '@/lib/parsers/gupta-email';

export const VENDOR_IDS = [
  'vendor1_shakti',
  'vendor2_everest',
  'vendor3_metro',
  'vendor4_rajdhani',
  'vendor5_gupta',
] as const;

export async function getSingleVendor(
  id: string, 
  rfx: RFx, 
  forceLive = false
): Promise<VendorResponse> {
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
}

export async function getAllVendors(rfx: RFx): Promise<VendorResponse[]> {
  const vendors: VendorResponse[] = [];

  for (const id of VENDOR_IDS) {
    try {
      const vendor = await getSingleVendor(id, rfx, false);
      if (vendor) {
        vendors.push(vendor);
      }
    } catch (err) {
      console.error(`Error loading vendor ${id}:`, err);
    }
  }

  return vendors;
}
