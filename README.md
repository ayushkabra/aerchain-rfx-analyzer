# Aerchain RFx Analyzer — "Kill the Quote Spreadsheet"

An enterprise-grade procurement quote extraction, deterministic normalization, trust auditing, and natural language interrogation system built for category procurement buyers.

> **Tech Stack:** Next.js 14 (App Router) • TypeScript • Tailwind CSS • Groq LLM Inference (`openai/gpt-oss-20b` & `meta-llama/llama-4-scout-17b-16e-instruct`) • Local JSON Persistence.

---

## 1. What This System Solves
In enterprise procurement, RFx responses arrive in messy, heterogeneous formats:
- Structured Excel workbooks (`.xlsx`)
- Multi-page corporate PDFs with footnote terms (`.pdf`)
- Word documents with prose paragraphs and non-standard units (`.docx`)
- Low-contrast phone photographs of paper rate cards (`.jpg`)
- Informal email quotes with vague per-kg rates (`.txt`)

Buyers traditionally spend days copying numbers into messy spreadsheets, making mental math errors on FX rates and tare weights, and losing provenance when audits occur.

The **Aerchain RFx Analyzer** automates ingestion, extracts prices and questionnaire compliance with source citations, runs **deterministic normalization in TypeScript**, flags confidence exceptions in a **Needs Review** lane, and lets buyers **interrogate quotes in plain language** to draft boardroom-ready award memos.

---

## 2. Architecture & The 8 Slices Built

### Slice 1: Canonical RFx Specification
- Canonical dataset defined in [`data/rfx.json`](file:///c:/Users/Ayush/Aerchain/data/rfx.json) with **30 corrugated packaging line items** across 3-ply, 5-ply, 7-ply, and 9-ply cartons, self-locking mailers, and pallet trays.
- Contains exact dimensions (`dims_mm`), demand quantities (`qty`), unit of measure (`uom`), and tare weights (`weight_kg_per_box`).
- Enforces 4 supplier gating questions (ISO 9001:2015, payment days, lead times, recycled content).

### Slice 2 & 3: Multi-Format Extraction Pipeline (All 5 Vendors)
Each vendor response is parsed dynamically from raw disk files with confidence scores and source provenance `{doc, locationHint, snippet}`:
1. **Shakti Packaging (`.xlsx`)**: Deterministically parsed cell-by-cell using `xlsx` to extract all 30 line items with exact coordinates (`Commercial Quote!E2`..`E31`) and compliance responses.
2. **Everest Corrugators (`.pdf`)**: Extracts rates quoted in USD ($), captures the 4% volume discount footnote for orders `>10,000` units, and maps ISO 9001 compliance.
3. **Metro Packaging (`.docx`)**: Extracts prose quotations from document paragraphs; parses rates quoted "per 100 nos" (`uomOriginal: "per_100"`), and flags unquoted lines 14 & 27 as `coverage: "missing"`.
4. **Rajdhani Boards (`.jpg` photo)**: Analyzes angled rate card photograph; assigns lower confidence (0.52) to faint rows 5, 11, 19, and 24, and marks unanswered recycled content questionnaire items.
5. **Gupta Carton Works (`.txt` email)**: Parses vague per-kg rates (₹38/kg 3-ply, ₹42/kg 5-ply, ₹47/kg 7-ply) plus ₹10 plate print surcharge; flags ambiguous specialty lines.

### Slice 4: Deterministic Normalization Engine
- **Zero LLM Mental Math:** The LLM is never allowed to calculate currency conversions or unit multiplications.
- **Currency Normalization:** Converts USD to INR via configurable exchange rate (default ₹85/USD), surfaced as an assumption in the UI.
- **UOM Normalization:** Converts "per 100" ($\div 100$) and "per kg" ($\times \text{weight\_kg\_per\_box} + \text{surcharge}$) into INR per box.
- **Discount Modeling:** Applies Everest's 4% volume discount footnote only to qualifying high-volume lines (`>10k`).
- **Omission Integrity:** Missing lines remain visible gaps (`Omitted`), never converted to ₹0.

### Slice 5: Comparison Matrix UI
- 30-line interactive side-by-side grid with lowest price badges (`LOW` in emerald).
- Dynamic FX assumption slider recalculating rates in real time.
- Instant spend KPIs comparing cherry-picked spend (₹96.38L) against single-vendor baselines.
- Interactive side-drawer showing cell provenance, verbatim source text, and assumptions trail.

### Slice 6: Trust UX & Audit Trail
- **Needs Review Lane:** Centralizes all low-confidence inferences ($<85\%$), ambiguous conversions, and vendor omissions for human sign-off.
- **Photo Crop Preview:** Visual bounding box preview for Rajdhani's faint ink photograph rows.
- **Manual Overrides with Audit Trail:** Buyers can input negotiated prices with reasons; the original extracted figure is permanently preserved.

### Slice 7: Plain Language Interrogation Engine
- Natural language query bar with 5 preset procurement scenarios:
  - *ISO 9001 Gated Split:* Filters vendors before allocating lines.
  - *Dual-Source (Shakti vs Everest):* Head-to-head allocation.
  - *High-Volume Lines (>10k):* Optimizes bulk commitments.
  - *3-Ply Carton Requirements:* Targeted category subset.
  - *Least-Cost Unconstrained:* Absolute mathematical floor.
- **Pipeline:** Query $\to$ Structured mathematical AST (`InterrogateOperation`) $\to$ Deterministic TypeScript execution $\to$ Boardroom CPO memo citing verified figures.

### Slice 8: RFx Drafting Co-Pilot
- Natural language category brief $\to$ Structured RFx JSON matching `RFxSchema`.
- Generates 5–10 line items with realistic dimensions, tare weights, and questionnaire gates.
- Allows 1-click JSON export and clipboard copy.

---

## 3. Key Technical Decisions

| Decision | Rationale |
| :--- | :--- |
| **Zero LLM Arithmetic** | LLMs are notorious for hallucinating floating-point math and currency conversions. All calculations are executed deterministically in TypeScript. |
| **Separation of Extraction vs Normalization** | Extraction captures verbatim quotes (`$0.209`, `₹38/kg`). Normalization applies business assumptions. This allows buyers to change FX assumptions without re-running extractions. |
| **Exact Source Coordinates** | Every extracted cell retains `{doc, locationHint, snippet}`. In a procurement audit, buyers can prove where every number came from. |
| **Deterministic Local Caching** | Cached responses in `/data/cache/` ensure sub-100ms load times and eliminate exposure to Groq's 8,000 TPM free-tier rate limit during evaluation. |

---

## 4. What Was Deliberately Left Out (Honest Scoping)

1. **Relational Database / Multi-tenant Auth:** Local JSON storage was specified in §1 to eliminate external database setup hurdles while maintaining 100% portability.
2. **Real-time Live ERP Sync (SAP / Coupa):** Instead of proprietary connector bloat, clean standard JSON export/import was built.
3. **Hardcoded Answer Keys:** The system extracts from raw files using schema validation; nothing is hardcoded from the README.

---

## 5. Local Setup & Verification

```bash
# 1. Install dependencies
npm install

# 2. Configure .env.local
GROQ_API_KEY=your_groq_api_key
TEXT_MODEL=openai/gpt-oss-20b
VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# 3. Launch Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to inspect all 8 slices:
- **Tab 1: 1. RFx (30 Lines)**
- **Tab 2: 2–3. Vendor Intake (5 Formats)**
- **Tab 3: 4–5. Comparison Matrix**
- **Tab 4: 6. Trust UX (Needs Review Lane & Photo Crop Preview)**
- **Tab 5: 7. Interrogate (Plain Language Querying & Boardroom Memos)**
- **Tab 6: 8. Draft Co-Pilot (Natural Language to Structured RFx Specification)**
