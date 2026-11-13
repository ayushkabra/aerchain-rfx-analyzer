import { RFx, RFxSchema } from '@/types/schema';
import { callLLMText } from './llm';
import { cleanJsonText } from './extraction';

export async function draftRFxWithLLM(buyerBrief: string): Promise<RFx> {
  const systemPrompt = `You are an elite enterprise procurement category manager.
You draft professional RFx (Request for Quote/Proposal) documents.
Convert the buyer's procurement brief into a structured RFx JSON object.
Ensure:
- id: e.g. "RFX-2026-CUSTOM-001"
- title: Professional title
- category: Product/Service category
- currency: "INR" (or specified)
- lineItems: Array of at least 5-10 realistic line items with lineNo, description, qty, uom ("box", "piece", etc), ply (3, 5, or 7), size ("S", "M", "L", "XL"), dims_mm ("200x150x100"), weight_kg_per_box (realistic decimal e.g. 0.25).
- questionnaire: Array of 3-4 gating questions (id: "q1", question: string, type: "yes_no" | "number" | "text").
- terms: Standard commercial and delivery payment terms.
Return ONLY valid JSON matching this schema.`;

  const userPrompt = `BUYER BRIEF:
"${buyerBrief}"

Return JSON matching:
{
  "id": "RFX-2026-CUSTOM-001",
  "title": "Annual Rate Contract — Packaging",
  "category": "Corrugated Packaging",
  "currency": "INR",
  "lineItems": [
    {
      "lineNo": 1,
      "description": "...",
      "qty": 5000,
      "uom": "box",
      "ply": 3,
      "size": "M",
      "dims_mm": "310x220x150",
      "weight_kg_per_box": 0.22
    }
  ],
  "questionnaire": [
    { "id": "q1", "question": "Are you ISO 9001 certified?", "type": "yes_no" }
  ],
  "terms": "..."
}`;

  try {
    const rawJson = await callLLMText({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.1,
    });

    const parsed = JSON.parse(cleanJsonText(rawJson));
    return RFxSchema.parse(parsed);
  } catch (err) {
    console.warn('Drafting LLM call failed, using high-fidelity category template fallback:', err);
    return getFallbackDraft(buyerBrief);
  }
}

function getFallbackDraft(brief: string): RFx {
  const isEcom = brief.toLowerCase().includes('ecom') || brief.toLowerCase().includes('apparel');
  
  return {
    id: `RFX-2026-GEN-${Date.now().toString().slice(-4)}`,
    title: isEcom 
      ? 'Annual Sourcing Contract — E-Commerce Secondary & Tertiary Packaging' 
      : 'Annual Rate Contract — Industrial Corrugated Cartons & Shippers',
    category: 'Corrugated Packaging',
    buyer: 'Category Sourcing Lead — Supply Chain Operations',
    currency: 'INR',
    lineItems: [
      {
        lineNo: 1,
        description: '3-ply Die-Cut Self-Locking Mailer Box Small (200x140x70mm)',
        qty: 25000,
        uom: 'box',
        ply: 3,
        size: 'S',
        dims_mm: '200x140x70',
        weight_kg_per_box: 0.09,
      },
      {
        lineNo: 2,
        description: '3-ply Plain Shipper Box Medium (300x200x150mm)',
        qty: 15000,
        uom: 'box',
        ply: 3,
        size: 'M',
        dims_mm: '300x200x150',
        weight_kg_per_box: 0.18,
      },
      {
        lineNo: 3,
        description: '5-ply Printed Master Outer Carton Large (450x350x250mm)',
        qty: 12000,
        uom: 'box',
        ply: 5,
        size: 'L',
        dims_mm: '450x350x250',
        weight_kg_per_box: 0.45,
      },
      {
        lineNo: 4,
        description: '5-ply Plain Heavy Shipper XL (550x400x300mm)',
        qty: 8000,
        uom: 'box',
        ply: 5,
        size: 'XL',
        dims_mm: '550x400x300',
        weight_kg_per_box: 0.65,
      },
      {
        lineNo: 5,
        description: '7-ply Export Grade Pallet Box (600x500x400mm)',
        qty: 3500,
        uom: 'box',
        ply: 7,
        size: 'XL',
        dims_mm: '600x500x400',
        weight_kg_per_box: 1.10,
      },
    ],
    questionnaire: [
      {
        id: 'q1',
        question: 'Are you ISO 9001:2015 certified for packaging manufacturing?',
        type: 'yes_no',
      },
      {
        id: 'q2',
        question: 'Standard payment credit days offered (e.g. 30, 60, 90)?',
        type: 'number',
      },
      {
        id: 'q3',
        question: 'Production lead time for replenishment batches (days)?',
        type: 'number',
      },
      {
        id: 'q4',
        question: 'Percentage of recycled virgin craft pulp utilized (%)?',
        type: 'number',
      },
    ],
    terms: 'Prices to be quoted in INR per box, ex-works. Delivery to central distribution center within agreed SLA. Defective lot return threshold: 1.5%. Payment credit terms: Net 45 days.',
  };
}
