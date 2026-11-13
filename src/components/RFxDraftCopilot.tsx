'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Download, 
  Copy, 
  CheckCircle2, 
  FileText, 
  Layers, 
  HelpCircle, 
  AlertCircle,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { RFx } from '@/types/schema';

const SAMPLE_BRIEFS = [
  {
    title: 'E-Commerce Apparel Shippers',
    brief: 'Draft an RFx for direct-to-consumer apparel packaging: 3-ply lightweight mailers, 5-ply master cartons, 100% recycled craft, 60,000 units total annual demand.'
  },
  {
    title: 'Heavy Industrial Machinery Boxes',
    brief: 'Create an RFx for industrial export packaging: 7-ply and 9-ply heavy-duty cargo boxes, pallet runner integration, high bursting strength, 10,000 units.'
  },
  {
    title: 'FMCG Food-Grade Packaging',
    brief: 'Annual rate contract for food-grade secondary packaging: odorless corrugation, B-flute and C-flute 3-ply and 5-ply cartons, ISO 22000 mandatory.'
  }
];

export function RFxDraftCopilot() {
  const [brief, setBrief] = useState(SAMPLE_BRIEFS[0].brief);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftedRfx, setDraftedRfx] = useState<RFx | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(customBrief?: string) {
    const textToUse = customBrief || brief;
    if (!textToUse.trim()) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch('/api/draft-rfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: textToUse }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to draft RFx');
      }

      setDraftedRfx(json.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error drafting RFx');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadJson() {
    if (!draftedRfx) return;
    const blob = new Blob([JSON.stringify(draftedRfx, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draftedRfx.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyJson() {
    if (!draftedRfx) return;
    navigator.clipboard.writeText(JSON.stringify(draftedRfx, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 mb-1">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>SLICE 8 • RFX DRAFTING CO-PILOT</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">
          Natural Language to Structured RFx Specification
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Describe your packaging requirements in plain language. The AI co-pilot generates a complete, 
          structured RFx specification with line items, tare weights, technical dimensions, and questionnaire gates ready for vendor distribution.
        </p>

        {/* Input area */}
        <div className="mt-5 space-y-3">
          <textarea
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Describe what you want to source (e.g. 5-ply cartons for electronics, dimensions, volumes, quality certifications)..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-semibold mr-1">Sample briefs:</span>
              {SAMPLE_BRIEFS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setBrief(s.brief);
                    handleGenerate(s.brief);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !brief.trim()}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center space-x-2 transition-all self-end sm:self-auto"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Drafting RFx...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate RFx</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drafted RFx Output Display */}
      {draftedRfx && (
        <div className="space-y-6">
          
          {/* Metadata Card & Export Actions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SPECIFICATION COMPILED • {draftedRfx.id}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">{draftedRfx.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Category: <strong className="text-slate-300">{draftedRfx.category}</strong> • Currency: <strong className="text-slate-300">{draftedRfx.currency}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyJson}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download RFx JSON</span>
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-orange-400" />
                <span>Generated Line Items ({draftedRfx.lineItems.length} SKUs)</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Validated against LineItemSchema
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-3 py-2.5">Ply</th>
                    <th className="px-3 py-2.5">Size</th>
                    <th className="px-3 py-2.5">Dimensions (mm)</th>
                    <th className="px-3 py-2.5 text-right">Unit Tare Wt</th>
                    <th className="px-4 py-2.5 text-right">Volume</th>
                    <th className="px-3 py-2.5">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {draftedRfx.lineItems.map(item => (
                    <tr key={item.lineNo} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 text-slate-400 font-bold">{item.lineNo}</td>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-200">{item.description}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                          {item.ply}P
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">{item.size}</td>
                      <td className="px-3 py-2.5 text-slate-400">{item.dims_mm}</td>
                      <td className="px-3 py-2.5 text-right text-slate-300">{item.weight_kg_per_box} kg</td>
                      <td className="px-4 py-2.5 text-right text-orange-400 font-bold">{item.qty.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-slate-400">{item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Questionnaire & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Questionnaire */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>Supplier Compliance Questionnaire ({draftedRfx.questionnaire.length} Gating Questions)</span>
              </h4>
              <div className="space-y-2">
                {draftedRfx.questionnaire.map(q => (
                  <div key={q.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">{q.id}</span>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Type: {q.type}</span>
                    </div>
                    <div className="text-slate-200 font-medium">{q.question}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commercial Terms */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Commercial Terms &amp; Conditions</span>
              </h4>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                {draftedRfx.terms}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
