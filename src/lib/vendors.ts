import fs from 'fs';
import path from 'path';
import { RFx, VendorResponse } from '@/types/schema';
import { loadVendorFromCache, saveVendorToCache } from '@/lib/cache';
import { parseExcelDocument } from '@/lib/parsers/excel';
import { extractVendorFromText, extractVendorFromImage } from '@/lib/extract-vendor';
import { extractPdfText, extractDocxText, readPlainText } from '@/lib/parsers/document-text';

export const VENDOR_IDS = [
  'vendor1_shakti', 'vendor2_everest', 'vendor3_metro', 'vendor4_rajdhani', 'vendor5_gupta',
] as const;

const VENDORS_DIR = path.join(process.cwd(), 'data', 'vendors');

async function extractVendorLive(id: string, rfx: RFx): Promise<VendorResponse> {
  if (id === 'vendor1_shakti') {
    const xlsx = path.join(VENDORS_DIR, 'vendor1_shakti_packaging.xlsx');
    const text = parseExcelDocument(xlsx).fullTextForLLM;
    return extractVendorFromText({ rawText: text, rfx, vendorId: id, sourceFormat: 'excel', sourceFileName: 'vendor1_shakti_packaging.xlsx' });
  }
  if (id === 'vendor2_everest') {
    const pdf = path.join(VENDORS_DIR, 'vendor2_everest_corrugators.pdf');
    const text = await extractPdfText(pdf);
    return extractVendorFromText({ rawText: text, rfx, vendorId: id, sourceFormat: 'pdf', sourceFileName: 'vendor2_everest_corrugators.pdf' });
  }
  if (id === 'vendor3_metro') {
    const docx = path.join(VENDORS_DIR, 'vendor3_metro_pack.docx');
    const txt = path.join(VENDORS_DIR, 'vendor3_metro_pack.txt');
    const useDocx = fs.existsSync(docx);
    const text = useDocx ? await extractDocxText(docx) : readPlainText(txt);
    return extractVendorFromText({ rawText: text, rfx, vendorId: id, sourceFormat: 'word', sourceFileName: useDocx ? 'vendor3_metro_pack.docx' : 'vendor3_metro_pack.txt' });
  }
  if (id === 'vendor4_rajdhani') {
    const jpg = path.join(VENDORS_DIR, 'vendor4_rajdhani_ratecard_photo.jpg');
    const base64 = fs.readFileSync(jpg).toString('base64');
    return extractVendorFromImage({ imageBase64: base64, imageMimeType: 'image/jpeg', rfx, vendorId: id, sourceFileName: 'vendor4_rajdhani_ratecard_photo.jpg' });
  }
  if (id === 'vendor5_gupta') {
    const txt = path.join(VENDORS_DIR, 'gupta_email.txt');
    return extractVendorFromText({ rawText: readPlainText(txt), rfx, vendorId: id, sourceFormat: 'email', sourceFileName: 'gupta_email.txt' });
  }
  throw new Error(`Unknown vendorId: ${id}`);
}

export async function getSingleVendor(id: string, rfx: RFx, forceLive = false): Promise<VendorResponse> {
  if (!forceLive) {
    const cached = loadVendorFromCache(id);
    if (cached) return cached;
  }
  const response = await extractVendorLive(id, rfx);
  saveVendorToCache(response); // best-effort; a read-only FS (Vercel) just skips the write
  return response;
}

export async function getAllVendors(rfx: RFx): Promise<VendorResponse[]> {
  const vendors: VendorResponse[] = [];
  for (const id of VENDOR_IDS) {
    try {
      vendors.push(await getSingleVendor(id, rfx, false));
    } catch (err) {
      console.error(`Extraction failed for ${id}:`, err);
    }
  }
  return vendors;
}
