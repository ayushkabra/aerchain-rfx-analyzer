import fs from 'fs';
import path from 'path';
import { RFx, RFxSchema } from '@/types/schema';

export function getCanonicalRFx(): RFx {
  const filePath = path.join(process.cwd(), 'data', 'rfx.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`RFx canonical file not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const validated = RFxSchema.parse(json);
  return validated;
}
