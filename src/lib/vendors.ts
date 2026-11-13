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

export async function getAllVendors(rfx: RFx): Promise<VendorResponse[]> {
  const vendors: VendorResponse[] = [];

  for (const id of VENDOR_IDS) {
    try {
      let vendor = loadVendorFromCache(id);
      if (!vendor) {
        if (id === 'vendor1_shakti') {
          const excelPath = path.join(process.cwd(), 'data', 'vendors', 'vendor1_shakti_packaging.xlsx');
          vendor = parseShaktiExcel(excelPath, rfx);
        } else if (id === 'vendor2_everest') {
          vendor = await parseEverestPDF(rfx);
        } else if (id === 'vendor3_metro') {
          vendor = await parseMetroWord(rfx);
        } else if (id === 'vendor4_rajdhani') {
          vendor = await parseRajdhaniVision(rfx);
        } else if (id === 'vendor5_gupta') {
          vendor = await parseGuptaEmail(rfx);
        }

        if (vendor) {
          saveVendorToCache(vendor);
        }
      }

      if (vendor) {
        vendors.push(vendor);
      }
    } catch (err) {
      console.error(`Error loading vendor ${id}:`, err);
    }
  }

  return vendors;
}
