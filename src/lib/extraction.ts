import fs from 'fs';
import path from 'path';
import { RFx, VendorResponse, VendorResponseSchema } from '@/types/schema';
import { callLLMText } from './llm';
import { parseExcelDocument } from './parsers/excel';

const EXTRACTIONS_DIR = path.join(process.cwd(), 'data', 'extractions');

function ensureExtractionsDir() {
  if (!fs.existsSync(EXTRACTIONS_DIR)) {
    fs.mkdirSync(EXTRACTIONS_DIR, { recursive: true });
  }
}

export function saveExtractedVendorResponse(response: VendorResponse) {
  ensureExtractionsDir();
  const filePath = path.join(EXTRACTIONS_DIR, `${response.vendorId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response, null, 2), 'utf-8');
}

export function loadExtractedVendorResponse(vendorId: string): VendorResponse | null {
  ensureExtractionsDir();
  const filePath = path.join(EXTRACTIONS_DIR, `${vendorId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);
    return VendorResponseSchema.parse(json);
  } catch (err) {
    console.error(`Failed to load cached extraction for ${vendorId}:`, err);
    return null;
  }
}

// Clean markdown code blocks from LLM output
export function cleanJsonText(text: string): string {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean.trim();
}

// Sanitize raw LLM JSON before validation
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
              source: { doc: fileName, locationHint: `Row ${idx + 2}`, snippet: q }
            };
          }
        }

        // Clean price
        let price = q.unitPriceOriginal;
        if (typeof price === 'string') {
          price = parseFloat(price.replace(/[^\d.-]/g, '')) || null;
        }

        return {
          lineNo: typeof q.lineNo === 'number' ? q.lineNo : (idx + 1),
          rawText: q.rawText || `Line ${idx + 1}`,
          unitPriceOriginal: typeof price === 'number' && !isNaN(price) ? price : null,
          uomOriginal: q.uomOriginal || 'box',
          coverage: ['quoted', 'missing', 'ambiguous'].includes(q.coverage) ? q.coverage : 'quoted',
          confidence: typeof q.confidence === 'number' ? Math.max(0, Math.min(1, q.confidence)) : 0.95,
          source: {
            doc: q.source?.doc || fileName,
            locationHint: q.source?.locationHint || `Row ${idx + 2}`,
            snippet: q.source?.snippet || q.rawText || '',
          },
          notes: q.notes,
        };
      });
    }
  }

  // 2. Sanitize questionnaireAnswers
  if (result.questionnaireAnswers) {
    let answers = result.questionnaireAnswers;
    if (!Array.isArray(answers) && typeof answers === 'object') {
      answers = Object.entries(answers).map(([qId, item]: [string, any]) => {
        if (typeof item === 'object' && item !== null) {
          return {
            qId,
            questionText: item.questionText,
            answer: item.answer ?? item.value ?? item.response ?? String(item),
            confidence: typeof item.confidence === 'number' ? item.confidence : 0.9,
            source: item.source || { doc: fileName, locationHint: 'Compliance & Terms', snippet: String(item.answer ?? item) }
          };
        }
        return {
          qId,
          answer: item,
          confidence: 0.9,
          source: { doc: fileName, locationHint: 'Compliance & Terms', snippet: String(item) }
        };
      });
    }
    result.questionnaireAnswers = answers;
  }

  // 3. Sanitize terms
  if (!result.terms || typeof result.terms !== 'object') {
    result.terms = {};
  }

  return result;
}

export async function extractExcelVendorResponse(
  excelFilePath: string, 
  rfx: RFx,
  vendorId = 'vendor1_shakti'
): Promise<{ response: VendorResponse; rawLLMOutput: string; repairPassUsed: boolean }> {
  // 1. Parse Excel into structured text
  const parsedExcel = parseExcelDocument(excelFilePath);

  // 2. Format Canonical RFx line items for mapping
  const canonicalLinesSummary = rfx.lineItems.map(item => 
    `Line ${item.lineNo}: ${item.description} | Ply: ${item.ply} | Size: ${item.size} | Dims: ${item.dims_mm} | Qty: ${item.qty} ${item.uom}`
  ).join('\n');

  const questionnaireSummary = rfx.questionnaire.map(q => 
    `[${q.id}] ${q.question} (Type: ${q.type})`
  ).join('\n');

  // 3. System and User prompts
  const systemPrompt = `You are a high-precision AI procurement extraction engine.
You extract vendor quotes from off-template vendor documents and map them to a canonical RFx.

HARD RULES:
1. NO FABRICATION: Never invent prices, terms, or answers. Extract strictly what is present in the vendor document.
2. SOURCE PROVENANCE: Every extracted quote and questionnaire answer MUST include:
   - "doc": the document name ("${parsedExcel.fileName}")
   - "locationHint": exact sheet name and row number (e.g. "Sheet: 'Commercial Quote', Row 4")
   - "snippet": the verbatim text snippet from that row.
3. LINE MAPPING: Map each vendor quote row to the corresponding canonical RFx lineNo (1 to ${rfx.lineItems.length}).
4. CONFIDENCE: Provide a numeric confidence score between 0.00 and 1.00.
5. NO ARITHMETIC NORMALIZATION: Do NOT convert currencies or units. Extract "unitPriceOriginal" as quoted.
6. JSON SCHEMA CONFORMANCE:
   - "lineQuotes" MUST be an array of JSON objects (one per quoted item).
   - "questionnaireAnswers" MUST be an array of JSON objects with {"qId": "q1", "answer": ...}.
7. OUTPUT: Respond ONLY with a valid JSON object matching the requested schema.`;

  const userPrompt = `CANONICAL RFx LINE ITEMS TO MAP AGAINST:
${canonicalLinesSummary}

MANDATORY QUESTIONNAIRE:
${questionnaireSummary}

VENDOR DOCUMENT DATA EXTRACTED FROM EXCEL:
${parsedExcel.fullTextForLLM}

Return JSON with this exact structure:
{
  "vendorId": "${vendorId}",
  "name": "Discovered vendor company name",
  "sourceFormat": "excel",
  "sourceFileName": "${parsedExcel.fileName}",
  "currencyOriginal": "INR",
  "lineQuotes": [
    {
      "lineNo": 1,
      "rawText": "SHK-3P-S-PL | Offered Price (INR/Box): 7.50",
      "unitPriceOriginal": 7.50,
      "uomOriginal": "box",
      "coverage": "quoted",
      "confidence": 0.95,
      "source": {
        "doc": "${parsedExcel.fileName}",
        "locationHint": "Sheet: Commercial Quote, Row 2",
        "snippet": "SHK-3P-S-PL | Offered Price (INR/Box): 7.50"
      }
    }
  ],
  "questionnaireAnswers": [
    {
      "qId": "q1",
      "questionText": "Are you ISO 9001:2015 certified?",
      "answer": "Yes (Certificate No: ISO-9001-2023-SHK)",
      "confidence": 0.98,
      "source": {
        "doc": "${parsedExcel.fileName}",
        "locationHint": "Sheet: Compliance & Terms, Row 3",
        "snippet": "ISO 9001:2015 Certified: Yes"
      }
    }
  ],
  "terms": {
    "freight": "Freight included for deliveries in NCR...",
    "paymentDays": 45,
    "leadTimeDays": 7,
    "discountNote": null
  },
  "flags": [],
  "overallConfidence": 0.95
}`;

  let rawLLMOutput = await callLLMText({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  let repairPassUsed = false;
  let parsedJson: any;

  try {
    parsedJson = JSON.parse(cleanJsonText(rawLLMOutput));
  } catch (e: any) {
    repairPassUsed = true;
    const repairPrompt = `Your previous output was not valid JSON. Error: ${e.message}. Return ONLY the valid JSON object.`;
    rawLLMOutput = await callLLMText({
      systemPrompt,
      userPrompt: repairPrompt,
      jsonMode: true,
    });
    parsedJson = JSON.parse(cleanJsonText(rawLLMOutput));
  }

  // Pre-sanitize before validation
  let sanitized = sanitizeRawVendorJson(parsedJson, parsedExcel.fileName, vendorId);

  // Zod validation
  const validation = VendorResponseSchema.safeParse(sanitized);

  if (!validation.success) {
    repairPassUsed = true;
    console.warn('Zod validation warning on initial extraction. Running 1 repair pass with error diagnostics...');
    const errorDetails = JSON.stringify(validation.error.format(), null, 2);
    
    const repairPrompt = `The previous JSON output failed validation:
${errorDetails}

Please ensure:
1. "lineQuotes" is an array of objects where each item has lineNo, rawText, unitPriceOriginal (number), uomOriginal, coverage, confidence, and source {doc, locationHint, snippet}.
2. "questionnaireAnswers" is an array of objects with {qId, answer, confidence, source}.

Return ONLY the corrected JSON object.`;

    const repairedOutput = await callLLMText({
      systemPrompt,
      userPrompt: repairPrompt,
      jsonMode: true,
    });

    const repairedJson = JSON.parse(cleanJsonText(repairedOutput));
    const repairedSanitized = sanitizeRawVendorJson(repairedJson, parsedExcel.fileName, vendorId);
    const repairedValidation = VendorResponseSchema.parse(repairedSanitized);

    repairedValidation.extractedAt = new Date().toISOString();
    saveExtractedVendorResponse(repairedValidation);

    return {
      response: repairedValidation,
      rawLLMOutput: repairedOutput,
      repairPassUsed: true,
    };
  }

  const validResponse = validation.data;
  validResponse.extractedAt = new Date().toISOString();
  saveExtractedVendorResponse(validResponse);

  return {
    response: validResponse,
    rawLLMOutput,
    repairPassUsed,
  };
}
