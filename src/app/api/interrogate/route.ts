import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalRFx } from '@/lib/rfx';
import { getAllVendors } from '@/lib/vendors';
import { normalizeVendorQuotes } from '@/lib/normalization';
import { 
  parseBuyerQueryToOperation, 
  executeDeterministicMath, 
  generateExecutiveMemo 
} from '@/lib/interrogate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = (body.question || '').trim();
    const fxRate = typeof body.fxRate === 'number' ? body.fxRate : 85.0;
    const overrides = body.manualOverrides || {};

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'A question or interrogation query is required.' },
        { status: 400 }
      );
    }

    // 1. Load canonical RFx and all vendor proposals
    const rfx = getCanonicalRFx();
    const vendors = await getAllVendors(rfx);

    // 2. Build normalized comparison matrix (deterministic TypeScript)
    const comparison = normalizeVendorQuotes(rfx, vendors, {
      fxRateUSDToINR: fxRate,
      manualOverrides: overrides,
    });

    // 3. Compile buyer question into typed mathematical AST
    const operation = await parseBuyerQueryToOperation(question, comparison);

    // 4. Execute deterministic math in TypeScript (never in LLM mind)
    const mathResult = executeDeterministicMath(operation, rfx, comparison, vendors);

    // 5. Generate executive memo citing exact verified numbers
    const memo = await generateExecutiveMemo(mathResult, question);

    return NextResponse.json({
      success: true,
      data: {
        question,
        operation,
        mathResult,
        memo,
      },
    });
  } catch (error: any) {
    console.error('Interrogation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process interrogation query' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const question = searchParams.get('q') || 'What if we split cheapest per line among ISO 9001 certified vendors?';
    const fxRate = parseFloat(searchParams.get('fxRate') || '85.0');

    const rfx = getCanonicalRFx();
    const vendors = await getAllVendors(rfx);

    const comparison = normalizeVendorQuotes(rfx, vendors, {
      fxRateUSDToINR: fxRate,
    });

    const operation = await parseBuyerQueryToOperation(question, comparison);
    const mathResult = executeDeterministicMath(operation, rfx, comparison, vendors);
    const memo = await generateExecutiveMemo(mathResult, question);

    return NextResponse.json({
      success: true,
      data: {
        question,
        operation,
        mathResult,
        memo,
      },
    });
  } catch (error: any) {
    console.error('Interrogation GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process interrogation query' },
      { status: 500 }
    );
  }
}

