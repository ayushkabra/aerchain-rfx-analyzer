import { 
  RFx, 
  VendorResponse, 
  Comparison, 
  ComparisonRow, 
  ComparisonCell, 
  VendorSummary 
} from '@/types/schema';

export interface NormalizationOptions {
  fxRateUSDToINR?: number; // default 85.0
  manualOverrides?: Record<string, { price: number; reason: string }>; // key: `${vendorId}_${lineNo}`
}

export function normalizeVendorQuotes(
  rfx: RFx,
  vendorResponses: VendorResponse[],
  options: NormalizationOptions = {}
): Comparison {
  const fxRate = options.fxRateUSDToINR ?? 85.0;
  const overrides = options.manualOverrides ?? {};

  // Map of vendor line quotes for fast lookup: vendorId -> Map<lineNo, LineQuote>
  const vendorQuotesMap = new Map<string, Map<number, any>>();
  vendorResponses.forEach(v => {
    const quoteMap = new Map<number, any>();
    v.lineQuotes.forEach(q => {
      if (q.lineNo !== null && q.lineNo !== undefined) {
        quoteMap.set(q.lineNo, q);
      }
    });
    vendorQuotesMap.set(v.vendorId, quoteMap);
  });

  const comparisonRows: ComparisonRow[] = [];

  // 1. Process each canonical RFx line item
  rfx.lineItems.forEach(lineItem => {
    const cells: Record<string, ComparisonCell> = {};
    let lowestPriceForLine: number | null = null;
    let highestPriceForLine: number | null = null;

    vendorResponses.forEach(vendor => {
      const quote = vendorQuotesMap.get(vendor.vendorId)?.get(lineItem.lineNo);
      const assumptions: string[] = [];

      // Check if line is missing or omitted
      if (!quote || quote.coverage === 'missing' || quote.unitPriceOriginal === null || isNaN(quote.unitPriceOriginal)) {
        cells[vendor.vendorId] = {
          vendorId: vendor.vendorId,
          vendorName: vendor.name,
          lineNo: lineItem.lineNo,
          unitPriceOriginal: null,
          currencyOriginal: vendor.currencyOriginal,
          uomOriginal: null,
          unitPriceNormalized: null,
          extendedCost: null,
          effectiveUnitPrice: null,
          effectiveExtendedCost: null,
          coverage: 'missing',
          confidence: quote?.confidence ?? 0.9,
          isLowestPrice: false,
          source: quote?.source || {
            doc: vendor.sourceFileName,
            locationHint: 'Omitted / Not quoted',
            snippet: 'Vendor did not submit a price for this line item'
          },
          assumptionsApplied: ['Visible gap: Line omitted or unquoted by vendor (never ₹0)'],
        };
        return;
      }

      // Check manual overrides
      const overrideKey = `${vendor.vendorId}_${lineItem.lineNo}`;
      const manualOverride = overrides[overrideKey];

      let unitPriceOriginal = quote.unitPriceOriginal;
      const currency = vendor.currencyOriginal;
      const uom = (quote.uomOriginal || 'box').toLowerCase();
      let coverage = quote.coverage;
      let conf = quote.confidence;

      // Currency conversion to INR
      let rateInINR = unitPriceOriginal;
      if (currency === 'USD') {
        rateInINR = unitPriceOriginal * fxRate;
        assumptions.push(`FX conversion: $${unitPriceOriginal.toFixed(3)} × ₹${fxRate.toFixed(2)}/USD = ₹${rateInINR.toFixed(2)}`);
      }

      // UOM conversion to INR per box
      let unitPriceNormalized = rateInINR;
      const isPrinted = lineItem.description.toLowerCase().includes('printed');

      if (uom === 'box' || uom === 'piece' || uom === 'pc' || uom === 'nos') {
        unitPriceNormalized = rateInINR;
      } else if (uom === 'per_100' || uom === 'per 100 nos' || uom === '100 nos') {
        unitPriceNormalized = rateInINR / 100;
        assumptions.push(`UOM conversion: ₹${rateInINR.toFixed(2)} / 100 nos = ₹${unitPriceNormalized.toFixed(2)}/box`);
      } else if (uom === 'per_kg' || uom === 'kg') {
        const baseBoxRate = rateInINR * lineItem.weight_kg_per_box;
        const printSurcharge = isPrinted ? 10.0 : 0.0;
        unitPriceNormalized = baseBoxRate + printSurcharge;
        assumptions.push(
          `Weight conversion: ₹${rateInINR.toFixed(2)}/kg × ${lineItem.weight_kg_per_box} kg/box` +
          (isPrinted ? ' + ₹10.00 print plate surcharge' : '') +
          ` = ₹${unitPriceNormalized.toFixed(2)}/box`
        );
      } else {
        coverage = 'ambiguous';
        assumptions.push(`Ambiguous UOM (${uom}): price held as nominal value`);
      }

      // Volume discount handling (e.g. Everest 4% footnote discount for lines > 10,000 qty)
      let effectiveUnitPrice = unitPriceNormalized;
      if (vendor.terms.volumeDiscountPercent && lineItem.qty > (vendor.terms.volumeDiscountThresholdQty || 0)) {
        const discountFraction = vendor.terms.volumeDiscountPercent / 100;
        effectiveUnitPrice = unitPriceNormalized * (1 - discountFraction);
        assumptions.push(
          `Volume discount: ${vendor.terms.volumeDiscountPercent}% off applied for annual qty > ${(vendor.terms.volumeDiscountThresholdQty || 0).toLocaleString()} (effective: ₹${effectiveUnitPrice.toFixed(2)}/box)`
        );
      }

      // Apply manual override if active
      if (manualOverride) {
        effectiveUnitPrice = manualOverride.price;
        unitPriceNormalized = manualOverride.price;
        assumptions.push(`Manual override: ₹${manualOverride.price.toFixed(2)} (${manualOverride.reason})`);
      }

      const extendedCost = Math.round(unitPriceNormalized * lineItem.qty);
      const effectiveExtendedCost = Math.round(effectiveUnitPrice * lineItem.qty);

      // Track min/max
      if (lowestPriceForLine === null || effectiveUnitPrice < lowestPriceForLine) {
        lowestPriceForLine = effectiveUnitPrice;
      }
      if (highestPriceForLine === null || effectiveUnitPrice > highestPriceForLine) {
        highestPriceForLine = effectiveUnitPrice;
      }

      cells[vendor.vendorId] = {
        vendorId: vendor.vendorId,
        vendorName: vendor.name,
        lineNo: lineItem.lineNo,
        unitPriceOriginal,
        currencyOriginal: currency,
        uomOriginal: quote.uomOriginal,
        unitPriceNormalized: parseFloat(unitPriceNormalized.toFixed(2)),
        extendedCost,
        effectiveUnitPrice: parseFloat(effectiveUnitPrice.toFixed(2)),
        effectiveExtendedCost,
        coverage,
        confidence: conf,
        isLowestPrice: false, // marked in next pass
        source: quote.source,
        assumptionsApplied: assumptions,
        override: manualOverride ? {
          originalValue: unitPriceOriginal,
          overriddenValue: manualOverride.price,
          reason: manualOverride.reason,
          overriddenAt: new Date().toISOString()
        } : undefined
      };
    });

    // Mark lowest price flags
    if (lowestPriceForLine !== null) {
      Object.values(cells).forEach(cell => {
        if (cell.effectiveUnitPrice !== null && Math.abs(cell.effectiveUnitPrice - lowestPriceForLine!) < 0.01) {
          cell.isLowestPrice = true;
        }
      });
    }

    const priceSpread = (lowestPriceForLine && highestPriceForLine && lowestPriceForLine > 0)
      ? parseFloat((((highestPriceForLine - lowestPriceForLine) / lowestPriceForLine) * 100).toFixed(1))
      : null;

    comparisonRows.push({
      lineItem,
      cells,
      minEffectivePrice: lowestPriceForLine,
      maxEffectivePrice: highestPriceForLine,
      priceSpreadPercent: priceSpread,
    });
  });

  // 2. Compute Vendor Summaries
  const vendorSummaries: VendorSummary[] = vendorResponses.map(vendor => {
    let totalSpend = 0;
    let quotedCount = 0;
    let totalConfidence = 0;

    comparisonRows.forEach(row => {
      const cell = row.cells[vendor.vendorId];
      if (cell && cell.coverage === 'quoted' && cell.effectiveExtendedCost !== null) {
        totalSpend += cell.effectiveExtendedCost;
        quotedCount++;
        totalConfidence += cell.confidence;
      }
    });

    const linesTotal = rfx.lineItems.length;
    const coveragePercent = parseFloat(((quotedCount / linesTotal) * 100).toFixed(1));
    const avgConfidence = quotedCount > 0 ? parseFloat((totalConfidence / quotedCount).toFixed(2)) : 0;

    // Compliance score calculation (out of 4 questionnaire gates)
    let passedCriteria = 0;
    vendor.questionnaireAnswers.forEach(ans => {
      if (ans.qId === 'q1' && ans.answer && String(ans.answer).toLowerCase().includes('yes')) passedCriteria++;
      if (ans.qId === 'q2' && ans.answer && Number(ans.answer) >= 30) passedCriteria++;
      if (ans.qId === 'q3' && ans.answer && Number(ans.answer) <= 14) passedCriteria++;
      if (ans.qId === 'q4' && ans.answer && Number(ans.answer) > 0) passedCriteria++;
    });
    const complianceScore = Math.round((passedCriteria / 4) * 100);

    return {
      vendorId: vendor.vendorId,
      name: vendor.name,
      sourceFormat: vendor.sourceFormat,
      totalSpendINR: totalSpend,
      linesQuoted: quotedCount,
      linesTotal,
      coveragePercent,
      avgConfidence,
      complianceScore,
      terms: vendor.terms,
      flags: vendor.flags,
    };
  });

  // 3. Cherry-picked lowest spend across all lines
  let cherryPickedSpend = 0;
  comparisonRows.forEach(row => {
    if (row.minEffectivePrice !== null) {
      cherryPickedSpend += Math.round(row.minEffectivePrice * row.lineItem.qty);
    }
  });

  const fullCoverageVendors = vendorSummaries.filter(v => v.linesQuoted === rfx.lineItems.length);
  const singleVendorBestSpend = fullCoverageVendors.length > 0
    ? Math.min(...fullCoverageVendors.map(v => v.totalSpendINR))
    : (vendorSummaries.length > 0 ? Math.min(...vendorSummaries.map(v => v.totalSpendINR)) : 0);

  const potentialSavings = singleVendorBestSpend > 0 && cherryPickedSpend > 0
    ? parseFloat((((singleVendorBestSpend - cherryPickedSpend) / singleVendorBestSpend) * 100).toFixed(1))
    : 0;

  return {
    rfxId: rfx.id,
    fxRateUSDToINR: fxRate,
    generatedAt: new Date().toISOString(),
    rows: comparisonRows,
    vendors: vendorSummaries,
    totalBaselineSpend: singleVendorBestSpend,
    cheapestCherryPickedSpend: cherryPickedSpend,
    singleVendorBestSpend,
    potentialSavingsPercent: potentialSavings,
  };
}
