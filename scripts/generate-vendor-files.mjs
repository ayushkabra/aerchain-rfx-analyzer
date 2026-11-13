import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const vendorsDir = path.join(projectRoot, 'data', 'vendors');
const publicVendorsDir = path.join(projectRoot, 'public', 'vendors');
const cacheDir = path.join(projectRoot, 'data', 'cache');

[vendorsDir, publicVendorsDir, cacheDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('Generating 30-line vendor dataset in data/vendors and public/vendors...');

// 1. Copy the uploaded photo if present
const uploadedPhotoPath = 'C:/Users/Ayush/.gemini/antigravity/brain/84dc9efd-8786-4862-acca-0fec846dd3e2/.user_uploaded/media_1794559392798.jpg';
if (fs.existsSync(uploadedPhotoPath)) {
  const destDataPhoto = path.join(vendorsDir, 'vendor4_rajdhani_ratecard_photo.jpg');
  const destPublicPhoto = path.join(publicVendorsDir, 'vendor4_rajdhani_ratecard_photo.jpg');
  fs.copyFileSync(uploadedPhotoPath, destDataPhoto);
  fs.copyFileSync(uploadedPhotoPath, destPublicPhoto);
  console.log('✓ Copied Rajdhani rate card photo');
}

// 2. Generate vendor1_shakti_packaging.xlsx (30 rows, off-template columns)
const shaktiRows = [
  { "Internal SKU": "SHK-3P-S-PL", "Item Description": "3-ply Plain Box Small (230x160x100mm)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 7.50, "Annual Capacity (Pcs)": 2000, "MOQ": 500, "Remarks": "Standard kraft liner" },
  { "Internal SKU": "SHK-3P-S-PR", "Item Description": "3-ply Printed Box Small (230x160x100mm)", "Ply": 3, "Finish": "Printed", "Offered Price (INR/Box)": 16.80, "Annual Capacity (Pcs)": 12000, "MOQ": 2000, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-3P-M-PL", "Item Description": "3-ply Plain Box Medium (310x220x150mm)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 11.80, "Annual Capacity (Pcs)": 5000, "MOQ": 1000, "Remarks": "Bursting strength 12kg/cm2" },
  { "Internal SKU": "SHK-3P-M-PR", "Item Description": "3-ply Printed Box Medium (310x220x150mm)", "Ply": 3, "Finish": "Printed", "Offered Price (INR/Box)": 22.40, "Annual Capacity (Pcs)": 5000, "MOQ": 1000, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-3P-L-PL", "Item Description": "3-ply Plain Box Large (400x300x200mm)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 21.90, "Annual Capacity (Pcs)": 2000, "MOQ": 500, "Remarks": "Bursting strength 14kg/cm2" },
  { "Internal SKU": "SHK-3P-L-PR", "Item Description": "3-ply Printed Box Large (400x300x200mm)", "Ply": 3, "Finish": "Printed", "Offered Price (INR/Box)": 29.50, "Annual Capacity (Pcs)": 12000, "MOQ": 2000, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-3P-XL-PL", "Item Description": "3-ply Plain Box XL (500x350x250mm)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 30.20, "Annual Capacity (Pcs)": 2000, "MOQ": 500, "Remarks": "Standard flap overlap" },
  { "Internal SKU": "SHK-3P-XL-PR", "Item Description": "3-ply Printed Box XL (500x350x250mm)", "Ply": 3, "Finish": "Printed", "Offered Price (INR/Box)": 40.50, "Annual Capacity (Pcs)": 30000, "MOQ": 5000, "Remarks": "2-colour flexo brand printing" },
  { "Internal SKU": "SHK-5P-S-PL", "Item Description": "5-ply Plain Box Small (230x160x100mm)", "Ply": 5, "Finish": "Plain", "Offered Price (INR/Box)": 7.10, "Annual Capacity (Pcs)": 15000, "MOQ": 2000, "Remarks": "Heavy duty flute" },
  { "Internal SKU": "SHK-5P-S-PR", "Item Description": "5-ply Printed Box Small (230x160x100mm)", "Ply": 5, "Finish": "Printed", "Offered Price (INR/Box)": 18.20, "Annual Capacity (Pcs)": 2000, "MOQ": 500, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-5P-M-PL", "Item Description": "5-ply Plain Box Medium (310x220x150mm)", "Ply": 5, "Finish": "Plain", "Offered Price (INR/Box)": 14.90, "Annual Capacity (Pcs)": 8000, "MOQ": 1000, "Remarks": "Bursting strength 16kg/cm2" },
  { "Internal SKU": "SHK-5P-M-PR", "Item Description": "5-ply Printed Box Medium (310x220x150mm)", "Ply": 5, "Finish": "Printed", "Offered Price (INR/Box)": 24.10, "Annual Capacity (Pcs)": 20000, "MOQ": 2500, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-5P-L-PL", "Item Description": "5-ply Plain Box Large (400x300x200mm)", "Ply": 5, "Finish": "Plain", "Offered Price (INR/Box)": 23.50, "Annual Capacity (Pcs)": 12000, "MOQ": 2000, "Remarks": "Bursting strength 18kg/cm2" },
  { "Internal SKU": "SHK-5P-L-PR", "Item Description": "5-ply Printed Box Large (400x300x200mm)", "Ply": 5, "Finish": "Printed", "Offered Price (INR/Box)": 34.80, "Annual Capacity (Pcs)": 20000, "MOQ": 2000, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-5P-XL-PL", "Item Description": "5-ply Plain Box XL (500x350x250mm)", "Ply": 5, "Finish": "Plain", "Offered Price (INR/Box)": 33.60, "Annual Capacity (Pcs)": 30000, "MOQ": 3000, "Remarks": "Heavy export grade" },
  { "Internal SKU": "SHK-5P-XL-PR", "Item Description": "5-ply Printed Box XL (500x350x250mm)", "Ply": 5, "Finish": "Printed", "Offered Price (INR/Box)": 42.90, "Annual Capacity (Pcs)": 20000, "MOQ": 2000, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-7P-S-PL", "Item Description": "7-ply Plain Box Small (230x160x100mm)", "Ply": 7, "Finish": "Plain", "Offered Price (INR/Box)": 9.40, "Annual Capacity (Pcs)": 2000, "MOQ": 500, "Remarks": "Extra heavy cushioning" },
  { "Internal SKU": "SHK-7P-S-PR", "Item Description": "7-ply Printed Box Small (230x160x100mm)", "Ply": 7, "Finish": "Printed", "Offered Price (INR/Box)": 18.90, "Annual Capacity (Pcs)": 5000, "MOQ": 1000, "Remarks": "2-colour flexo" },
  { "Internal SKU": "SHK-7P-M-PL", "Item Description": "7-ply Plain Box Medium (310x220x150mm)", "Ply": 7, "Finish": "Plain", "Offered Price (INR/Box)": 17.50, "Annual Capacity (Pcs)": 30000, "MOQ": 5000, "Remarks": "Triple wall construction" },
  { "Internal SKU": "SHK-7P-M-PR", "Item Description": "7-ply Printed Box Medium (310x220x150mm)", "Ply": 7, "Finish": "Printed", "Offered Price (INR/Box)": 24.20, "Annual Capacity (Pcs)": 15000, "MOQ": 2000, "Remarks": "Triple wall, 2-colour print" },
  { "Internal SKU": "SHK-7P-L-PL", "Item Description": "7-ply Plain Box Large (400x300x200mm)", "Ply": 7, "Finish": "Plain", "Offered Price (INR/Box)": 28.30, "Annual Capacity (Pcs)": 20000, "MOQ": 2000, "Remarks": "Triple wall kraft" },
  { "Internal SKU": "SHK-7P-L-PR", "Item Description": "7-ply Printed Box Large (400x300x200mm)", "Ply": 7, "Finish": "Printed", "Offered Price (INR/Box)": 36.90, "Annual Capacity (Pcs)": 5000, "MOQ": 1000, "Remarks": "Triple wall kraft" },
  { "Internal SKU": "SHK-7P-XL-PL", "Item Description": "7-ply Plain Box XL (500x350x250mm)", "Ply": 7, "Finish": "Plain", "Offered Price (INR/Box)": 38.00, "Annual Capacity (Pcs)": 12000, "MOQ": 2000, "Remarks": "Maximum stacking strength" },
  { "Internal SKU": "SHK-7P-XL-PR", "Item Description": "7-ply Printed Box XL (500x350x250mm)", "Ply": 7, "Finish": "Printed", "Offered Price (INR/Box)": 49.80, "Annual Capacity (Pcs)": 5000, "MOQ": 1000, "Remarks": "Maximum stacking strength" },
  { "Internal SKU": "SHK-9P-BULK", "Item Description": "9-ply Heavy Duty Bulk Cargo Box (800x600x500mm)", "Ply": 9, "Finish": "Plain", "Offered Price (INR/Box)": 105.00, "Annual Capacity (Pcs)": 3000, "MOQ": 500, "Remarks": "Bulk container" },
  { "Internal SKU": "SHK-DC-MAIL-S", "Item Description": "Die-Cut Self-Locking Mailer Box S (200x140x70mm)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 8.20, "Annual Capacity (Pcs)": 15000, "MOQ": 2500, "Remarks": "E-flute mailer" },
  { "Internal SKU": "SHK-DC-MAIL-M", "Item Description": "Die-Cut Self-Locking Mailer Box M (280x200x100mm)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 13.50, "Annual Capacity (Pcs)": 25000, "MOQ": 3000, "Remarks": "E-flute mailer" },
  { "Internal SKU": "SHK-DC-MAIL-L", "Item Description": "Die-Cut Self-Locking Mailer Box L (350x250x120mm)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 21.00, "Annual Capacity (Pcs)": 10000, "MOQ": 2000, "Remarks": "B-flute mailer" },
  { "Internal SKU": "SHK-PART-24", "Item Description": "Corrugated Partition / Divider Set for Box M (24-cell)", "Ply": 3, "Finish": "Plain", "Offered Price (INR/Box)": 9.80, "Annual Capacity (Pcs)": 8000, "MOQ": 1000, "Remarks": "Interlocking grid" },
  { "Internal SKU": "SHK-PLT-TRAY", "Item Description": "Heavy Duty Corrugated Pallet Tray (1200x1000x150mm)", "Ply": 5, "Finish": "Plain", "Offered Price (INR/Box)": 68.00, "Annual Capacity (Pcs)": 5000, "MOQ": 500, "Remarks": "Foldable pallet cap" }
];

try {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const wsRates = XLSX.utils.json_to_sheet(shaktiRows);
  XLSX.utils.book_append_sheet(wb, wsRates, "Commercial Quote");

  const questionnaireData = [
    { "Parameter": "Vendor Name", "Response / Value": "Shakti Packaging Industries Pvt Ltd" },
    { "Parameter": "ISO 9001:2015 Certified", "Response / Value": "Yes (Certificate No: ISO-9001-2023-SHK)" },
    { "Parameter": "Standard Payment Terms", "Response / Value": "45 days from invoice date" },
    { "Parameter": "Repeat Order Lead Time", "Response / Value": "7 days" },
    { "Parameter": "Recycled Fibre Content (%)", "Response / Value": "55%" },
    { "Parameter": "Freight Terms", "Response / Value": "Freight included for deliveries in NCR; ₹1.20/box extra outside NCR" }
  ];
  const wsTerms = XLSX.utils.json_to_sheet(questionnaireData);
  XLSX.utils.book_append_sheet(wb, wsTerms, "Compliance & Terms");

  const excelPath = path.join(vendorsDir, 'vendor1_shakti_packaging.xlsx');
  XLSX.writeFile(wb, excelPath);
  console.log('✓ Generated vendor1_shakti_packaging.xlsx (all 30 rows)');
} catch (err) {
  console.error('XLSX error:', err);
}

// 3. Write vendor2_everest_corrugators text/content (USD pricing, 4% footnote discount)
const everestRates = [
  "1\t3-ply Plain Corrugated Box S (230x160x100mm)\t2,000\t0.093",
  "2\t3-ply Printed Corrugated Box S (230x160x100mm)\t12,000\t0.209",
  "3\t3-ply Plain Corrugated Box M (310x220x150mm)\t5,000\t0.146",
  "4\t3-ply Printed Corrugated Box M (310x220x150mm)\t5,000\t0.275",
  "5\t3-ply Plain Corrugated Box L (400x300x200mm)\t2,000\t0.269",
  "6\t3-ply Printed Corrugated Box L (400x300x200mm)\t12,000\t0.360",
  "7\t3-ply Plain Corrugated Box XL (500x350x250mm)\t2,000\t0.372",
  "8\t3-ply Printed Corrugated Box XL (500x350x250mm)\t30,000\t0.496",
  "9\t5-ply Plain Corrugated Box S (230x160x100mm)\t15,000\t0.087",
  "10\t5-ply Printed Corrugated Box S (230x160x100mm)\t2,000\t0.220",
  "11\t5-ply Plain Corrugated Box M (310x220x150mm)\t8,000\t0.182",
  "12\t5-ply Printed Corrugated Box M (310x220x150mm)\t20,000\t0.292",
  "13\t5-ply Plain Corrugated Box L (400x300x200mm)\t12,000\t0.286",
  "14\t5-ply Printed Corrugated Box L (400x300x200mm)\t20,000\t0.423",
  "15\t5-ply Plain Corrugated Box XL (500x350x250mm)\t30,000\t0.408",
  "16\t5-ply Printed Corrugated Box XL (500x350x250mm)\t20,000\t0.519",
  "17\t7-ply Plain Corrugated Box S (230x160x100mm)\t2,000\t0.113",
  "18\t7-ply Printed Corrugated Box S (230x160x100mm)\t5,000\t0.229",
  "19\t7-ply Plain Corrugated Box M (310x220x150mm)\t30,000\t0.212",
  "20\t7-ply Printed Corrugated Box M (310x220x150mm)\t15,000\t0.291",
  "21\t7-ply Plain Corrugated Box L (400x300x200mm)\t20,000\t0.344",
  "22\t7-ply Printed Corrugated Box L (400x300x200mm)\t5,000\t0.446",
  "23\t7-ply Plain Corrugated Box XL (500x350x250mm)\t12,000\t0.460",
  "24\t7-ply Printed Corrugated Box XL (500x350x250mm)\t5,000\t0.599",
  "25\t9-ply Heavy Duty Bulk Cargo Box (800x600x500mm)\t3,000\t1.250",
  "26\tDie-Cut Self-Locking Mailer Box S (200x140x70mm)\t15,000\t0.098",
  "27\tDie-Cut Self-Locking Mailer Box M (280x200x100mm)\t25,000\t0.162",
  "28\tDie-Cut Self-Locking Mailer Box L (350x250x120mm)\t10,000\t0.252",
  "29\tCorrugated Partition / Divider Set for Box M (24-cell)\t8,000\t0.115",
  "30\tHeavy Duty Corrugated Pallet Tray (1200x1000x150mm)\t5,000\t0.810"
];

const everestContent = `EVEREST CORRUGATORS PVT LTD
Plot 22, MIDC Industrial Area, Pune 411019 | GSTIN 27ABCDE1234F1Z5
Commercial Offer — RFX-2026-CORR-001 Ref EC/EXP/2026/337 Dt 11-Nov-2026
All prices below are quoted in USD per box, ex-works Pune. Prices firm for 45 days.

Line\tDescription\tQty\tRate (USD/box)
${everestRates.join('\n')}

Payment: 30 days net. Lead time: 10 days. ISO 9001:2015 certified. Recycled fibre content: 40%.
* A volume discount of 4% applies on the above rates for any line with annual quantity exceeding 10,000 boxes. Freight billed at actuals. USD quoted for export parity; INR billing at prevailing RBI reference rate on PO date.
`;
fs.writeFileSync(path.join(vendorsDir, 'vendor2_everest_corrugators.txt'), everestContent, 'utf-8');
console.log('✓ Generated vendor2_everest_corrugators.txt');

// 4. Write vendor3_metro_pack paragraph text (Word doc format - 28 of 30, lines 14 & 27 omitted, per 100 nos quotes)
const metroText = `METRO PACKAGING SOLUTIONS LLP
Andheri East, Mumbai 400069
Email: sales@metropack.co.in | GST: 27AABCM8891P1ZX

Ref: MPS/RFQ/2026/089
Date: 12-Nov-2026

Dear Nimbus Procurement Team,

With reference to RFX-2026-CORR-001 for corrugated packaging boxes, we submit our commercial offer below. Commercial rates are based on raw material paper rates of Nov 2026.

COMMERCIAL RATES:
For 3-ply small boxes (230x160x100mm), our rate is Rs. 7.80 per box for plain, and Rs. 17.50 per box for printed.
For 3-ply medium boxes (310x220x150mm), we quote Rs. 12.20 per box for plain, and Rs. 23.00 per box for printed.
For 3-ply large cartons (400x300x200mm), rate is Rs. 22.50 per box plain, and Rs. 30.50 per box printed.
For 3-ply extra large boxes (500x350x250mm), rate is Rs. 31.00 per box plain, and Rs. 41.50 per box printed.

For 5-ply cartons:
Small size (230x160x100mm) is Rs. 7.20 per box plain, and Rs. 19.00 per box printed.
Medium size (310x220x150mm) is Rs. 15.20 per box plain, and Rs. 24.80 per box printed.
Large size (400x300x200mm) plain is Rs. 24.50 per box. (Note: We do not have machine tooling capacity to quote for 5-ply Printed Large box line 14, so this item is omitted).
For Extra Large 5-ply boxes (500x350x250mm), plain boxes are quoted at Rs. 3,500 per 100 nos. Printed XL boxes are quoted at Rs. 4,350 per 100 nos.

For 7-ply heavy duty cartons:
Small 7-ply (230x160x100mm) is Rs. 10.20 per box plain, and Rs. 19.50 per box printed.
Medium 7-ply (310x220x150mm) is Rs. 18.20 per box plain, and Rs. 25.00 per box printed.
Large 7-ply (400x300x200mm) plain is Rs. 29.00 per box, and printed is Rs. 37.50 per box.
Extra Large 7-ply (500x350x250mm) plain is Rs. 3,900 per 100 nos. Printed 7-ply XL is Rs. 5,200 per 100 nos.

Specialty & Mailer lines:
Line 25 (9-ply Heavy Duty Bulk Cargo Box 800x600x500mm): Rs. 108.00 per box.
Line 26 (Die-Cut Self-Locking Mailer Box S 200x140x70mm): Rs. 8.40 per box.
Line 27 (Die-Cut Self-Locking Mailer Box M 280x200x100mm): NOT QUOTED (Out of stock on E-flute rotary die board, line 27 left blank).
Line 28 (Die-Cut Self-Locking Mailer Box L 350x250x120mm): Rs. 21.80 per box.
Line 29 (Corrugated Partition / Divider Set for Box M 24-cell): Rs. 10.20 per set.
Line 30 (Heavy Duty Corrugated Pallet Tray 1200x1000x150mm): Rs. 71.00 per tray.

COMMERCIAL TERMS & QUESTIONNAIRE:
1. ISO 9001:2015: Yes, certified by TUV Nord.
2. Payment Terms: 60 days net.
3. Delivery Lead Time: 12 working days from confirmed PO.
4. Recycled Content: 35% recycled kraft testliner.
5. Freight: Extra at ₹1.50 per box or at actual transporter docket.
`;
fs.writeFileSync(path.join(vendorsDir, 'vendor3_metro_pack.txt'), metroText, 'utf-8');
console.log('✓ Generated vendor3_metro_pack.txt');

console.log('Done updating 30-line vendor dataset!');
