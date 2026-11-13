AERCHAIN ASSIGNMENT — FABRICATED DATASET
Category: Corrugated Packaging | RFx: RFX-2026-CORR-001 | 30 line items, 5 vendors

FILES
- rfx.json .............. the canonical RFx (30 lines, questionnaire, terms). Load this as source of truth.
- vendor1_shakti_packaging.xlsx ... Excel, CLEAN data but OFF-TEMPLATE (columns renamed/reordered). All 30 lines, INR/box.
- vendor2_everest_corrugators.pdf . PDF on letterhead. Quoted in USD/box. 4% volume discount BURIED IN A FOOTNOTE (>10k qty).
- vendor3_metro_pack.docx ......... Word. Commercials in a PARAGRAPH. Some lines priced PER 100 NOS (not per box). Quotes 28 of 30 (lines 14, 27 blank).
- vendor4_rajdhani_ratecard_photo.jpg  ANGLED PHONE PHOTO of a printed rate card. Lines 5,11,19,24 are faint/low-contrast -> low confidence.
- vendor5_gupta_email.txt ......... Short vague EMAIL. Priced PER KG by ply, "rest same as last year", freight extra. Effectively PARTIAL/ambiguous.

PLANTED UGLY EDGES (what the system must handle honestly)
1. Currency: Everest is USD -> normalize to INR at a shown FX rate (default ₹85.00/USD).
2. UOM: Metro Pack 'per 100 nos' (÷100) and Gupta 'per kg' -> convert to per-box using weight_kg_per_box in rfx.json.
3. Partial coverage: Metro Pack missing lines 14 & 27; Rajdhani standard catalog lines 1..24; Gupta only covers ply-level -> show visible gaps, don't zero-fill.
4. Hidden term: Everest's 4% discount is in a footnote, not the table (applied to annual demand > 10,000 units).
5. Low confidence: Rajdhani photo rows 5,11,19,24 are hard to read -> flag amber/red, route to review, show cropped source.
6. Off-template: Shakti's columns don't match the RFx -> structure-agnostic deterministic cell parsing (e.g. Commercial Quote!E5).
7. Questionnaire: Shakti/Everest/Metro answer it; Rajdhani partial (missing recycled fibre); Gupta doesn't answer q1 or q4 -> missing != 0.
