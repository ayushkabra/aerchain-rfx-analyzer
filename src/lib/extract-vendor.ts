import { RFx, VendorResponse, VendorResponseSchema } from '@/types/schema';
import { callLLMText, callLLMVision } from './llm';
import { cleanJsonText, sanitizeRawVendorJson } from './extraction';

type SourceFormat = 'excel' | 'pdf' | 'word' | 'email' | 'photo';

function buildRfxContext(rfx: RFx): string {
  const lines = rfx.lineItems
    .map(l => `Line ${l.lineNo}: ${l.description}`)
    .join('\n');
  const q = rfx.questionnaire.map(qq => `${qq.id}: ${qq.question}`).join('\n');
  return `CANONICAL RFx LINE ITEMS (map each quote to lineNo):\n${lines}\n\nQUESTIONNAIRE:\n${q}`;
}

const EXTRACTION_RULES = `You are a procurement extraction engine. Extract ONLY what is actually present in the vendor document. Never invent a number, never fill from outside knowledge, never assume a value the document does not state.
RULES:
1. For every RFx line, find the vendor's quote. If the vendor did not price that line, set unitPriceOriginal=null and coverage="missing". Never output 0 for a line that was not quoted.
2. Record the price EXACTLY as the vendor states it, in THEIR currency and THEIR unit. Do NOT convert currency or units. Set currencyOriginal from the document itself. Set uomOriginal to one of: "box", "per_100", "per_kg", "piece" — choose based on what the document says. If a vendor quotes rates per kg by ply (e.g. per-kg rates for 3-ply, 5-ply, 7-ply boxes), map the stated per-kg rate to the box lines of that ply with uomOriginal="per_kg".
3. confidence (0.00-1.00) must reflect your genuine certainty FROM THE DOCUMENT: high only when the number is explicit and unambiguous; lower when it is implied, derived, or hard to read. Use coverage="ambiguous" when you are unsure which line or price applies.
4. source must point at the real evidence: {doc, locationHint (where in the document), snippet (the verbatim text you read the value from)}.
5. questionnaireAnswers: return EXACTLY one object for EACH questionnaire id (q1, q2, q3, q4), in order. If the document does not state an answer, set answer=null and confidence=0. Never omit a question.
6. terms: capture freight, paymentDays, leadTimeDays, discountNote, and volume discount (volumeDiscountPercent / volumeDiscountThresholdQty) ONLY if the document states them.
7. flags: short machine tags for anything notable you observed (e.g. "quoted_in_usd", "priced_per_100", "priced_per_kg", "line_omitted", "unanswered_questions").
Return ONLY a valid JSON object. No prose, no markdown.`;

function validateRaw(raw: string, vendorId: string, sourceFileName: string, sourceFormat: SourceFormat): VendorResponse {
  const parsed = JSON.parse(cleanJsonText(raw));
  const sanitized = sanitizeRawVendorJson(parsed, sourceFileName, vendorId);
  // Format + filename are metadata about WHICH file we opened — set deterministically.
  // currency / prices / answers / confidence are left exactly as the model returned them.
  sanitized.sourceFormat = sourceFormat;
  sanitized.sourceFileName = sourceFileName;
  const result = VendorResponseSchema.parse(sanitized);
  result.extractedAt = new Date().toISOString();
  return result;
}

async function runText(systemPrompt: string, userPrompt: string, vendorId: string, sourceFileName: string, sourceFormat: SourceFormat): Promise<VendorResponse> {
  const raw = await callLLMText({ systemPrompt, userPrompt, jsonMode: true, temperature: 0 });
  try {
    return validateRaw(raw, vendorId, sourceFileName, sourceFormat);
  } catch (e: any) {
    const repaired = await callLLMText({
      systemPrompt,
      userPrompt: `Return ONLY a valid JSON object. Fix structure only: ${e.message}\nRaw JSON was:\n${raw}`,
      jsonMode: true, temperature: 0,
    });
    return validateRaw(repaired, vendorId, sourceFileName, sourceFormat);
  }
}

export async function extractVendorFromText(params: {
  rawText: string; rfx: RFx; vendorId: string; sourceFormat: Exclude<SourceFormat, 'photo'>; sourceFileName: string;
}): Promise<VendorResponse> {
  const { rawText, rfx, vendorId, sourceFormat, sourceFileName } = params;
  const userPrompt = `${buildRfxContext(rfx)}

VENDOR DOCUMENT (${sourceFormat}, file "${sourceFileName}") — RAW CONTENT BELOW:
"""
${rawText}
"""

Return JSON: {
  vendorId: "${vendorId}",
  name: (vendor company name as written in document),
  sourceFormat: "${sourceFormat}",
  sourceFileName: "${sourceFileName}",
  currencyOriginal: (currency symbol or code found in document, e.g. "INR", "USD", "Rs."),
  terms: {
    freight: (freight terms string or null),
    paymentDays: (number of payment days or null),
    leadTimeDays: (lead time in days or null),
    discountNote: (discount details or null),
    volumeDiscountPercent: (volume discount % if stated, else null),
    volumeDiscountThresholdQty: (volume discount threshold qty if stated, else null)
  },
  questionnaireAnswers: [
    (Extract one object for EACH question q1, q2, q3, q4. If unmentioned in document, set answer=null, confidence=0)
    { qId: "q1", answer, confidence, source:{doc:"${sourceFileName}", locationHint, snippet} },
    { qId: "q2", answer, confidence, source:{doc:"${sourceFileName}", locationHint, snippet} },
    { qId: "q3", answer, confidence, source:{doc:"${sourceFileName}", locationHint, snippet} },
    { qId: "q4", answer, confidence, source:{doc:"${sourceFileName}", locationHint, snippet} }
  ],
  lineQuotes: [
    (Extract one object for EVERY RFx line from lineNo 1 to ${rfx.lineItems.length}. If a line is not quoted or omitted in the document, set unitPriceOriginal: null and coverage: "missing")
    { lineNo, rawText, unitPriceOriginal, uomOriginal, coverage, confidence, source:{doc:"${sourceFileName}", locationHint, snippet}, notes? }
  ],
  flags: (array of short string tags for notable observations),
  overallConfidence: (number between 0 and 1)
}`;
  return runText(EXTRACTION_RULES, userPrompt, vendorId, sourceFileName, sourceFormat);
}

export async function extractVendorFromImage(params: {
  imageBase64: string; imageMimeType?: string; rfx: RFx; vendorId: string; sourceFileName: string;
}): Promise<VendorResponse> {
  const { imageBase64, imageMimeType = 'image/jpeg', rfx, vendorId, sourceFileName } = params;
  const systemPrompt = `${EXTRACTION_RULES}
This document is a PHOTOGRAPH of a printed paper rate card, taken at an angle. Some rows may be faint, blurred, skewed, or cut off. Read only what you can actually see. If a row's price is not clearly legible, LOWER its confidence and set coverage="ambiguous" (or "missing" if you truly cannot read it). Never substitute a guessed number for one you cannot read.`;
  const userPrompt = `${buildRfxContext(rfx)}

The attached image is this vendor's rate card. For each RFx line, report the price you can read from the photo, matching rows by their printed description.
Return JSON: { vendorId: "${vendorId}", name, sourceFormat: "photo", sourceFileName: "${sourceFileName}", currencyOriginal, lineQuotes, questionnaireAnswers, terms, flags, overallConfidence }.
Each lineQuote: { lineNo, rawText, unitPriceOriginal, uomOriginal, coverage, confidence, source:{doc,locationHint,snippet}, notes? }.`;
  const raw = await callLLMVision({ systemPrompt, userPrompt, imageBase64, imageMimeType });
  try {
    return validateRaw(raw, vendorId, sourceFileName, 'photo');
  } catch (e: any) {
    // Vision models cannot always be re-prompted in JSON mode; one text-repair of the structure only.
    const repaired = await callLLMText({
      systemPrompt: EXTRACTION_RULES,
      userPrompt: `The following was a vision extraction that failed schema validation: ${e.message}\nHere is the raw output:\n${raw}\nReturn ONLY a corrected, valid JSON object. Fix STRUCTURE only — do not change any value the vision model read.`,
      jsonMode: true, temperature: 0,
    });
    return validateRaw(repaired, vendorId, sourceFileName, 'photo');
  }
}
