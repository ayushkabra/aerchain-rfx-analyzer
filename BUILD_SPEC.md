# BUILD SPEC — Aerchain RFx Analyzer
> Drop this at the repo root. This is the agent's context. Build strictly in the slice order in §9. After each slice, STOP and let me (the human) run it on the real files before continuing.

## 1. What we're building
A procurement buyer drafts an RFx, vendors reply in any format, the system **extracts + normalizes** every response into one side-by-side comparison, and the buyer **asks questions in plain language** → tables/charts → a defensible award.

Stack: **Next.js (App Router) + TypeScript + Tailwind**. Deploy on Vercel. Storage: local JSON (no DB).

## 2. Hard rules (do not break)
- The AI loops are REAL. **Never hardcode extracted values, demo answers, or the known contents of the dataset into code or prompts.** The system must *discover* everything from the files.
- The dataset ground truth in `README.txt` is for the HUMAN to verify against. **Do NOT put README contents into any runtime prompt.** The model reads the vendor file, not the answer key.
- Every extracted field carries a **confidence (0–1)** and a **source pointer** `{doc, locationHint, snippet}`. No silent guesses.
- Model IDs come from **env vars**, never hardcoded. API keys live in `.env.local` only, never committed.
- After each slice: it must actually call the API and produce validated output on the REAL files. No mocks, no "it should work."

## 3. Models (free tier — no billing)
Provider: **OpenRouter** (OpenAI-compatible). Base URL `https://openrouter.ai/api/v1`, header `Authorization: Bearer ${OPENROUTER_API_KEY}`.
- `.env.local`:
  - `OPENROUTER_API_KEY=...`
  - `TEXT_MODEL=` a free text model (e.g. a free Llama/Qwen/gpt-oss id ending in `:free`)
  - `VISION_MODEL=` a free vision model (e.g. `meta-llama/llama-3.2-11b-vision-instruct:free` or `qwen/qwen-2.5-vl-7b-instruct:free`)
- Use TEXT_MODEL for Excel/PDF-text/Word/email + all reasoning; VISION_MODEL only for the photo.
- Validate every extraction with **Zod** + one repair pass. On model/ratelimit error, surface it honestly in the UI — do not fake a result.

## 4. Data (already in /data)
- `/data/rfx.json` — canonical RFx: 24 (or 30) line items (each has `weight_kg_per_box` — used for UOM conversion), questionnaire, terms.
- `/data/vendors/` — 5 vendor responses: `shakti.xlsx`, `everest.pdf`, `metro.docx`, `rajdhani.jpg` (photo), `gupta_email.txt`.
These arrive in 5 different messy formats and shapes. The system must parse each without a fixed template.

## 5. Schema (Zod)
```ts
RFx { id, title, category, currency, lineItems[{lineNo, description, qty, uom, weight_kg_per_box, dims_mm, ply, size}], questionnaire[{id, question, type}], terms }

VendorResponse {
  vendorId, name, sourceFormat, currencyOriginal,
  lineQuotes[{ lineNo|null, rawText, unitPriceOriginal, uomOriginal,
               unitPriceNormalized /* INR per box */, coverage:"quoted"|"missing"|"ambiguous",
               confidence:0-1, source:{doc, locationHint, snippet} }],
  questionnaireAnswers[{ qId, answer, confidence, source }],
  terms:{ freight, paymentDays, discountNote }, flags[], overallConfidence
}

Comparison // computed: same lines, same unit (per box), same currency (INR), confidence+provenance carried through
```

## 6. Normalization engine (deterministic, in code — NOT guessed by the LLM)
- **Currency:** convert to INR at a single FX rate held in config and shown in the UI as an assumption.
- **UOM:** "per 100 nos" → ÷100 to per box; "per kg" → × `weight_kg_per_box`. If a conversion is uncertain, mark the cell `ambiguous`, don't convert silently.
- **Line matching:** LLM maps each vendor line to an RFx `lineNo` with confidence; unmatched → flagged, not dropped.
- **Coverage:** a missing line renders as a visible gap, never ₹0.

## 7. Trust UX (this is the main grade)
- Confidence per cell: green/amber/red. Amber+red also collected in a **"Needs review"** lane.
- Click any number → **provenance drawer**: the source doc + exact snippet; for the photo, show the cropped region.
- **Assumptions panel**: FX rate used, every UOM conversion applied, every guessed line match.
- Editable override, original preserved (audit trail).

## 8. NL analysis (hero demo)
Buyer asks in plain language over the whole comparison. Pipeline:
1. LLM parses the question into a **structured operation** (filters + op), e.g. "split cheapest per line among vendors who passed the questionnaire".
2. **Compute the math in TypeScript** (deterministic), not in the model's head.
3. LLM narrates the result + render a table/chart, citing the data.
Must handle arbitrary buyer questions at demo time — nothing hardcoded.

## 9. BUILD ORDER — one slice at a time, verify before moving on
1. Scaffold + load `rfx.json` + render the 30-line RFx.
2. Extraction for **Excel only** → Zod-validated VendorResponse with confidence+source → show the raw extracted JSON. Human verifies vs README.
3. Add PDF, then Word, then email, then the **photo (vision)** — one format per step, verify each.
4. Normalization engine (§6).
5. Comparison table UI.
6. Trust UX (§7).
7. NL analysis (§8).
8. RFx drafting co-pilot — thin LLM chat → structured RFx. (Cut this first if short on time.)
9. Deploy to Vercel (env vars set there too). Test the live URL.

## 10. Deliverables
Working prototype (live demo), recorded walkthrough, one-page note on decisions + what was deliberately left out. The README/one-pager must describe only what the system ACTUALLY does — no overclaiming.
