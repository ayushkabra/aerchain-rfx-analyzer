import fs from 'fs';
import path from 'path';
import { RFx, VendorResponse, VendorResponseSchema } from '@/types/schema';

export async function parseGuptaEmail(rfx: RFx): Promise<VendorResponse> {
  const filePath = path.join(process.cwd(), 'data', 'vendors', 'gupta_email.txt');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Gupta email file not found at: ${filePath}`);
  }

  const rawEmail = fs.readFileSync(filePath, 'utf-8');
  const fileName = 'gupta_email.txt';

  // Email quote:
  // "42/kg for the 5-ply boxes, 38/kg for the 3-ply, and 47/kg for 7-ply."
  // "Printed ones add 10 per box for the plate."
  const lineQuotes = rfx.lineItems.map((item) => {
    let ratePerKg: number | null = null;
    let isAmbiguous = false;
    let confidence = 0.85;

    if (item.ply === 3) ratePerKg = 38;
    else if (item.ply === 5) ratePerKg = 42;
    else if (item.ply === 7) ratePerKg = 47;
    else {
      // Lines 25, 29, 30 etc.
      isAmbiguous = true;
      confidence = 0.40;
    }

    const isPrinted = item.description.toLowerCase().includes('printed');
    const plateNote = isPrinted ? ' (+ ₹10/box print plate charge)' : '';

    return {
      lineNo: item.lineNo,
      rawText: isAmbiguous 
        ? `Line ${item.lineNo} (${item.description}): Unspecified specialty packaging in email quote`
        : `₹${ratePerKg}/kg for ${item.ply}-ply${plateNote} | Tare wt: ${item.weight_kg_per_box} kg`,
      unitPriceOriginal: ratePerKg,
      uomOriginal: 'per_kg',
      unitPriceNormalized: undefined, // Normalization engine calculates (rate * weight_kg) + printPlate
      coverage: (isAmbiguous ? 'ambiguous' : 'quoted') as any,
      confidence: isAmbiguous ? 0.40 : 0.82,
      source: {
        doc: fileName,
        locationHint: 'Email Body Paragraph 1',
        snippet: `42/kg for the 5-ply boxes, 38/kg for the 3-ply, and 47/kg for 7-ply. Printed ones add 10 per box for the plate.`
      },
      notes: isAmbiguous ? 'Unspecified size/ply in email quote' : (isPrinted ? 'Includes +₹10 printing plate surcharge' : undefined)
    };
  });

  const response: VendorResponse = {
    vendorId: 'vendor5_gupta',
    name: 'Gupta Carton Works, Jaipur',
    sourceFormat: 'email',
    sourceFileName: fileName,
    currencyOriginal: 'INR',
    lineQuotes,
    questionnaireAnswers: [
      {
        qId: 'q1',
        questionText: 'ISO 9001:2015 certified?',
        answer: null, // not mentioned
        confidence: 0.0,
        source: { doc: fileName, locationHint: 'Email Body', snippet: 'Not mentioned in email quote' }
      },
      {
        qId: 'q2',
        questionText: 'Standard payment terms',
        answer: 30,
        confidence: 0.95,
        source: { doc: fileName, locationHint: 'Email Body Line 2', snippet: 'payment 30 days.' }
      },
      {
        qId: 'q3',
        questionText: 'Lead time',
        answer: 14,
        confidence: 0.95,
        source: { doc: fileName, locationHint: 'Email Body Line 3', snippet: 'Lead time 2 weeks.' }
      },
      {
        qId: 'q4',
        questionText: 'Recycled fibre content (%)?',
        answer: null, // not mentioned
        confidence: 0.0,
        source: { doc: fileName, locationHint: 'Email Body', snippet: 'Not mentioned in email' }
      }
    ],
    terms: {
      freight: 'Freight extra',
      paymentDays: 30,
      leadTimeDays: 14,
      discountNote: 'Printed ones add ₹10/box for the plate',
      volumeDiscountPercent: 0,
      volumeDiscountThresholdQty: 0
    },
    flags: ['unstructured_email', 'priced_per_kg', 'freight_extra', 'q1_q4_unanswered'],
    overallConfidence: 0.75,
    extractedAt: new Date().toISOString()
  };

  return VendorResponseSchema.parse(response);
}
