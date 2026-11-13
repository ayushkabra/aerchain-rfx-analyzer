import { z } from 'zod';

// ==========================================
// 1. Canonical RFx Schema
// ==========================================

export const LineItemSchema = z.object({
  lineNo: z.number().int().positive(),
  description: z.string(),
  qty: z.number().nonnegative(),
  uom: z.string(),
  ply: z.number().int().positive(),
  size: z.enum(['S', 'M', 'L', 'XL']).or(z.string()),
  dims_mm: z.string(),
  weight_kg_per_box: z.number().positive(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

export const QuestionnaireItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(['yes_no', 'number', 'text']),
});

export type QuestionnaireItem = z.infer<typeof QuestionnaireItemSchema>;

export const RFxSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  buyer: z.string().optional(),
  currency: z.string().default('INR'),
  lineItems: z.array(LineItemSchema),
  questionnaire: z.array(QuestionnaireItemSchema),
  terms: z.string(),
});

export type RFx = z.infer<typeof RFxSchema>;

// ==========================================
// 2. Vendor Provenance & Response Schemas
// ==========================================

export const SourcePointerSchema = z.object({
  doc: z.string().default('document'),
  locationHint: z.string().default('quote table'),
  snippet: z.string().default(''),
  boundingBox: z.object({
    top: z.number(),
    left: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
});

export type SourcePointer = z.infer<typeof SourcePointerSchema>;

export const LineQuoteSchema = z.object({
  lineNo: z.number().nullable().optional().default(null),
  rawText: z.string().default(''),
  unitPriceOriginal: z.union([z.number(), z.string().transform(v => parseFloat(v) || null)]).nullable().optional().default(null),
  uomOriginal: z.string().nullable().optional().default('box'),
  unitPriceNormalized: z.number().nullable().optional(),
  coverage: z.enum(['quoted', 'missing', 'ambiguous']).default('quoted'),
  confidence: z.number().min(0).max(1).default(0.9),
  source: SourcePointerSchema.default({ doc: 'document', locationHint: 'table', snippet: '' }),
  notes: z.string().optional(),
});

export type LineQuote = z.infer<typeof LineQuoteSchema>;

export const QuestionnaireAnswerSchema = z.object({
  qId: z.string(),
  questionText: z.string().optional(),
  answer: z.union([z.string(), z.number(), z.boolean(), z.null()]).default(''),
  confidence: z.number().min(0).max(1).default(0.9),
  source: SourcePointerSchema.default({ doc: 'document', locationHint: 'terms', snippet: '' }),
});

export type QuestionnaireAnswer = z.infer<typeof QuestionnaireAnswerSchema>;

export const VendorTermsSchema = z.object({
  freight: z.string().nullable().optional().default(null),
  paymentDays: z.union([z.number(), z.string().transform(v => parseInt(v) || null)]).nullable().optional().default(null),
  leadTimeDays: z.union([z.number(), z.string().transform(v => parseInt(v) || null)]).nullable().optional().default(null),
  discountNote: z.string().nullable().optional().default(null),
  volumeDiscountPercent: z.number().optional().default(0),
  volumeDiscountThresholdQty: z.number().optional().default(0),
});

export type VendorTerms = z.infer<typeof VendorTermsSchema>;

// Preprocessed Line Quotes (handles strings or partial shapes)
export const LineQuotesArraySchema = z.preprocess((val) => {
  if (!Array.isArray(val)) return [];
  return val.map((item, idx) => {
    if (typeof item === 'string') {
      try {
        const parsed = JSON.parse(item);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch {}
      return {
        lineNo: idx + 1,
        rawText: item,
        unitPriceOriginal: null,
        uomOriginal: 'box',
        coverage: 'ambiguous',
        confidence: 0.5,
        source: { doc: 'document', locationHint: `Item ${idx + 1}`, snippet: item }
      };
    }
    return item;
  });
}, z.array(LineQuoteSchema));

// Preprocessed Questionnaire Answers (handles object dictionary or array)
export const QuestionnaireAnswersArraySchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return Object.entries(val).map(([qId, item]: [string, any]) => {
      if (typeof item === 'object' && item !== null) {
        return {
          qId,
          questionText: item.questionText,
          answer: item.answer ?? item.value ?? item.response ?? String(item),
          confidence: typeof item.confidence === 'number' ? item.confidence : 0.9,
          source: item.source || { doc: 'document', locationHint: 'terms', snippet: String(item.answer ?? item) }
        };
      }
      return {
        qId,
        answer: item,
        confidence: 0.9,
        source: { doc: 'document', locationHint: 'terms', snippet: String(item) }
      };
    });
  }
  return Array.isArray(val) ? val : [];
}, z.array(QuestionnaireAnswerSchema));

export const VendorResponseSchema = z.object({
  vendorId: z.string(),
  name: z.string().default('Unknown Vendor'),
  sourceFormat: z.enum(['excel', 'pdf', 'word', 'email', 'photo']),
  sourceFileName: z.string(),
  currencyOriginal: z.string().default('INR'),
  lineQuotes: LineQuotesArraySchema,
  questionnaireAnswers: QuestionnaireAnswersArraySchema,
  terms: VendorTermsSchema.default({}),
  flags: z.array(z.string()).default([]),
  overallConfidence: z.number().min(0).max(1).default(0.9),
  extractedAt: z.string().optional(),
});

export type VendorResponse = z.infer<typeof VendorResponseSchema>;

// ==========================================
// 3. Normalized Comparison Matrix Schema
// ==========================================

export const ComparisonCellSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  lineNo: z.number(),
  unitPriceOriginal: z.number().nullable(),
  currencyOriginal: z.string(),
  uomOriginal: z.string().nullable(),
  unitPriceNormalized: z.number().nullable(),
  extendedCost: z.number().nullable(),
  effectiveUnitPrice: z.number().nullable(),
  effectiveExtendedCost: z.number().nullable(),
  coverage: z.enum(['quoted', 'missing', 'ambiguous']),
  confidence: z.number().min(0).max(1),
  isLowestPrice: z.boolean().default(false),
  source: SourcePointerSchema,
  assumptionsApplied: z.array(z.string()).default([]),
  override: z.object({
    originalValue: z.number(),
    overriddenValue: z.number(),
    reason: z.string(),
    overriddenAt: z.string(),
  }).optional(),
});

export type ComparisonCell = z.infer<typeof ComparisonCellSchema>;

export const ComparisonRowSchema = z.object({
  lineItem: LineItemSchema,
  cells: z.record(z.string(), ComparisonCellSchema),
  minEffectivePrice: z.number().nullable(),
  maxEffectivePrice: z.number().nullable(),
  priceSpreadPercent: z.number().nullable(),
});

export type ComparisonRow = z.infer<typeof ComparisonRowSchema>;

export const VendorSummarySchema = z.object({
  vendorId: z.string(),
  name: z.string(),
  sourceFormat: z.string(),
  totalSpendINR: z.number(),
  linesQuoted: z.number(),
  linesTotal: z.number(),
  coveragePercent: z.number(),
  avgConfidence: z.number(),
  complianceScore: z.number(),
  terms: VendorTermsSchema,
  flags: z.array(z.string()),
});

export type VendorSummary = z.infer<typeof VendorSummarySchema>;

export const ComparisonSchema = z.object({
  rfxId: z.string(),
  fxRateUSDToINR: z.number().default(85),
  generatedAt: z.string(),
  rows: z.array(ComparisonRowSchema),
  vendors: z.array(VendorSummarySchema),
  totalBaselineSpend: z.number().optional(),
  cheapestCherryPickedSpend: z.number().optional(),
  singleVendorBestSpend: z.number().optional(),
  potentialSavingsPercent: z.number().optional(),
});

export type Comparison = z.infer<typeof ComparisonSchema>;
