import fs from 'fs';
import path from 'path';
import { VendorResponse, VendorResponseSchema } from '@/types/schema';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

export function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function saveVendorToCache(vendorResponse: VendorResponse): void {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${vendorResponse.vendorId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(vendorResponse, null, 2), 'utf-8');
}

export function loadVendorFromCache(vendorId: string): VendorResponse | null {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${vendorId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);
    return VendorResponseSchema.parse(json);
  } catch (err) {
    console.warn(`Cache read error for ${vendorId}:`, err);
    return null;
  }
}

export function isVendorCached(vendorId: string): boolean {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${vendorId}.json`);
  return fs.existsSync(filePath);
}
