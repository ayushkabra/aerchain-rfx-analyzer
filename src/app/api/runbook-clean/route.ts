import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filesToDelete = [
    path.join(process.cwd(), 'src', 'lib', 'parsers', 'shakti-excel.ts'),
    path.join(process.cwd(), 'src', 'lib', 'parsers', 'everest-pdf.ts'),
    path.join(process.cwd(), 'src', 'lib', 'parsers', 'metro-word.ts'),
    path.join(process.cwd(), 'src', 'lib', 'parsers', 'rajdhani-vision.ts'),
    path.join(process.cwd(), 'src', 'lib', 'parsers', 'gupta-email.ts'),
    path.join(process.cwd(), 'data', 'cache', 'vendor1_shakti.json'),
    path.join(process.cwd(), 'data', 'cache', 'vendor2_everest.json'),
    path.join(process.cwd(), 'data', 'cache', 'vendor3_metro.json'),
    path.join(process.cwd(), 'data', 'cache', 'vendor4_rajdhani.json'),
    path.join(process.cwd(), 'data', 'cache', 'vendor5_gupta.json'),
    path.join(process.cwd(), 'data', 'extractions', 'vendor1_shakti.json'),
  ];

  const results: Record<string, string> = {};

  for (const file of filesToDelete) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        results[file] = 'deleted';
      } else {
        results[file] = 'not_found';
      }
    } catch (e: any) {
      results[file] = `error: ${e.message}`;
    }
  }

  return NextResponse.json({ success: true, results });
}
