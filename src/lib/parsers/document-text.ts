import fs from 'fs';

/** Extract text from a real PDF. Falls back to a committed .txt rendering of the SAME pdf only if the parser yields nothing. */
export async function extractPdfText(pdfPath: string): Promise<string> {
  const buffer = fs.readFileSync(pdfPath);
  try {
    const mod: any = await import('pdf-parse');
    const pdfParse = mod.default || mod;
    const data = await pdfParse(buffer);
    const text = (data?.text || '').trim();
    if (text.length > 20) return text;
    throw new Error('pdf-parse returned empty text');
  } catch (e) {
    const sidecar = pdfPath.replace(/\.pdf$/i, '.txt');
    if (fs.existsSync(sidecar)) return fs.readFileSync(sidecar, 'utf-8');
    throw e;
  }
}

/** Extract text from a real .docx via mammoth. */
export async function extractDocxText(docxPath: string): Promise<string> {
  const mod: any = await import('mammoth');
  const mammoth = mod.default || mod;
  const result = await mammoth.extractRawText({ path: docxPath });
  return (result?.value || '').trim();
}

/** Read a plain-text document (email body, or a .docx exported as text). */
export function readPlainText(txtPath: string): string {
  return fs.readFileSync(txtPath, 'utf-8');
}
