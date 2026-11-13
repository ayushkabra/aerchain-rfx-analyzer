import fs from 'fs';
import path from 'path';
import { VendorResponse, VendorResponseSchema } from '@/types/schema';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

export function loadVendorFromCache(vendorId: string): VendorResponse | null {
  const file = path.join(CACHE_DIR, `${vendorId}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return VendorResponseSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveVendorToCache(data: VendorResponse): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, `${data.vendorId}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem on Vercel — ignore silently
  }
}

export function clearCache(): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) return;
    for (const f of fs.readdirSync(CACHE_DIR)) {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(CACHE_DIR, f));
    }
  } catch {}
}
