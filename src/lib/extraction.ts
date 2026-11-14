import fs from 'fs';
import path from 'path';
import { VendorResponse, VendorResponseSchema } from '@/types/schema';

const EXTRACTIONS_DIR = path.join(process.cwd(), 'data', 'extractions');

function ensureExtractionsDir() {
  if (!fs.existsSync(EXTRACTIONS_DIR)) {
    fs.mkdirSync(EXTRACTIONS_DIR, { recursive: true });
  }
}

export function saveExtractedVendorResponse(response: VendorResponse) {
  try {
    ensureExtractionsDir();
    const filePath = path.join(EXTRACTIONS_DIR, `${response.vendorId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(response, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem safe
  }
}

export function loadExtractedVendorResponse(vendorId: string): VendorResponse | null {
  const filePath = path.join(EXTRACTIONS_DIR, `${vendorId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);
    return VendorResponseSchema.parse(json);
  } catch (err) {
    return null;
  }
}

// Clean markdown code blocks from LLM output
export function cleanJsonText(text: string): string {
  let clean = text.trim();
  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    clean = codeBlockMatch[1].trim();
  } else if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }

  return clean.trim();
}

// Sanitize raw LLM JSON before validation to guarantee schema conformity
export function sanitizeRawVendorJson(raw: any, fileName: string, vendorId: string): any {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const result = { ...raw };
  result.vendorId = result.vendorId || vendorId;
  result.sourceFileName = result.sourceFileName || fileName;
  result.sourceFormat = result.sourceFormat || 'excel';
  result.currencyOriginal = result.currencyOriginal || 'INR';

  // 1. Sanitize lineQuotes
  if (result.lineQuotes) {
    let quotes = result.lineQuotes;
    if (!Array.isArray(quotes) && typeof quotes === 'object') {
      quotes = Object.values(quotes);
    }
    if (Array.isArray(quotes)) {
      result.lineQuotes = quotes.map((q: any, idx: number) => {
        if (typeof q === 'string') {
          try {
            const parsed = JSON.parse(q);
            if (typeof parsed === 'object' && parsed !== null) q = parsed;
          } catch {
            return {
              lineNo: idx + 1,
              rawText: q,
              unitPriceOriginal: null,
              uomOriginal: 'box',
              coverage: 'ambiguous',
              confidence: 0.5,
              source: { doc: fileName, locationHint: `Line ${idx + 1}`, snippet: q }
            };
          }
        }

        // Clean price
        let price = q.unitPriceOriginal;
        if (typeof price === 'string') {
          price = parseFloat(price.replace(/[^\d.-]/g, '')) || null;
        }

        let conf = typeof q.confidence === 'number' ? q.confidence : 0.9;
        if (conf > 1 && conf <= 100) conf = conf / 100;
        conf = Math.max(0, Math.min(1, conf));

        const lineNo = typeof q.lineNo === 'number' ? q.lineNo : (idx + 1);

        return {
          lineNo,
          rawText: q.rawText || `Line ${lineNo}`,
          unitPriceOriginal: typeof price === 'number' && !isNaN(price) ? price : null,
          uomOriginal: q.uomOriginal || 'box',
          coverage: ['quoted', 'missing', 'ambiguous'].includes(q.coverage) 
            ? q.coverage 
            : (price !== null ? 'quoted' : 'missing'),
          confidence: conf,
          source: q.source && typeof q.source === 'object' ? {
            doc: q.source.doc || fileName,
            locationHint: q.source.locationHint || `Line ${lineNo}`,
            snippet: q.source.snippet || q.rawText || '',
          } : {
            doc: fileName,
            locationHint: `Line ${lineNo}`,
            snippet: q.rawText || '',
          },
          notes: q.notes,
        };
      });

      // Ensure all lines 1 to 30 are represented (omitted lines get coverage: 'missing', unitPriceOriginal: null)
      const existingLineNos = new Set(result.lineQuotes.map((q: any) => q.lineNo));
      for (let i = 1; i <= 30; i++) {
        if (!existingLineNos.has(i)) {
          result.lineQuotes.push({
            lineNo: i,
            rawText: `Line ${i}`,
            unitPriceOriginal: null,
            uomOriginal: 'box',
            coverage: 'missing',
            confidence: 1,
            source: {
              doc: fileName,
              locationHint: 'document',
              snippet: 'Not quoted in document'
            }
          });
        }
      }
      result.lineQuotes.sort((a: any, b: any) => a.lineNo - b.lineNo);
    }
  }

  // 2. Sanitize questionnaireAnswers (handles array or dictionary)
  if (result.questionnaireAnswers) {
    let rawAnswers = result.questionnaireAnswers;
    let list: any[] = [];
    if (Array.isArray(rawAnswers)) {
      list = rawAnswers;
    } else if (typeof rawAnswers === 'object' && rawAnswers !== null) {
      list = Object.entries(rawAnswers).map(([k, v]: [string, any]) => {
        if (typeof v === 'object' && v !== null) {
          return { qId: k, ...v };
        }
        return { qId: k, answer: v };
      });
    }

    result.questionnaireAnswers = list.map((item: any, idx: number) => {
      const qId = item.qId || item.id || item.questionId || `q${idx + 1}`;
      let conf = typeof item.confidence === 'number' ? item.confidence : 0.9;
      if (conf > 1 && conf <= 100) conf = conf / 100;
      conf = Math.max(0, Math.min(1, conf));

      let answerVal = item.answer !== undefined ? item.answer : (item.value ?? item.response);
      if (typeof answerVal === 'object' && answerVal !== null) {
        const inner = answerVal.answer ?? answerVal.value ?? answerVal.response ?? answerVal.text;
        answerVal = inner === undefined || typeof inner === 'object' ? null : inner;
      }
      if (typeof answerVal === 'string' && answerVal.trim().toLowerCase() === '[object object]') {
        answerVal = null;
      }

      return {
        qId: String(qId),
        questionText: item.questionText || item.question,
        answer: answerVal ?? null,
        confidence: conf,
        source: item.source && typeof item.source === 'object' ? {
          doc: item.source.doc || fileName,
          locationHint: item.source.locationHint || 'Compliance & Terms',
          snippet: item.source.snippet || (typeof answerVal === 'string' ? answerVal : ''),
        } : {
          doc: fileName,
          locationHint: 'Compliance & Terms',
          snippet: typeof answerVal === 'string' ? answerVal : '',
        }
      };
    });
  } else {
    result.questionnaireAnswers = [];
  }

  // Ensure all 4 questionnaire answers (q1, q2, q3, q4) exist in order
  const standardQIds = ['q1', 'q2', 'q3', 'q4'];
  const existingQIds = new Set(result.questionnaireAnswers.map((a: any) => a.qId));
  for (const qId of standardQIds) {
    if (!existingQIds.has(qId)) {
      result.questionnaireAnswers.push({
        qId,
        answer: null,
        confidence: 0,
        source: {
          doc: fileName,
          locationHint: 'Compliance & Terms',
          snippet: 'Not stated in document'
        }
      });
    }
  }
  result.questionnaireAnswers.sort((a: any, b: any) => a.qId.localeCompare(b.qId));

  // 3. Sanitize terms
  if (!result.terms || typeof result.terms !== 'object') {
    result.terms = {};
  } else {
    if (typeof result.terms.paymentDays === 'string') {
      result.terms.paymentDays = parseInt(result.terms.paymentDays.replace(/\D/g, '')) || null;
    }
    if (typeof result.terms.leadTimeDays === 'string') {
      result.terms.leadTimeDays = parseInt(result.terms.leadTimeDays.replace(/\D/g, '')) || null;
    }
    if (typeof result.terms.volumeDiscountPercent === 'string') {
      result.terms.volumeDiscountPercent = parseFloat(result.terms.volumeDiscountPercent.replace(/[^\d.-]/g, '')) || null;
    }
  }

  // 4. Sanitize overallConfidence
  let overallConf = typeof result.overallConfidence === 'number' ? result.overallConfidence : 0.9;
  if (overallConf > 1 && overallConf <= 100) overallConf = overallConf / 100;
  result.overallConfidence = Math.max(0, Math.min(1, overallConf));

  return result;
}
