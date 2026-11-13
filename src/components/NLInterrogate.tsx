'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  TrendingDown, 
  Layers, 
  ShieldCheck, 
  Award, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  Info, 
  ExternalLink, 
  BarChart3, 
  Filter,
  DollarSign,
  Building,
  CheckCircle2
} from 'lucide-react';
import { MathExecutionResult, InterrogateOperation } from '@/lib/interrogate';

interface NLInterrogateProps {
  onGoToComparison?: () => void;
  onGoToTrust?: () => void;
}

const PRESET_QUERIES = [
  {
    label: 'ISO 9001 Gated Split',
    icon: '🛡️',
    query: 'What if we split cheapest per line among ISO 9001 certified vendors?',
    description: 'Enforces quality compliance before finding lowest unit rate'
  },
  {
    label: 'Dual-Source: Shakti vs Everest',
    icon: '⚖️',
    query: 'Compare Shakti vs Everest head-to-head for our box volume',
    description: 'Eliminates long-tail vendors and pits top 2 incumbents'
  },
  {
    label: 'High-Volume Lines (>10k)',
    icon: '🏭',
    query: 'Allocate high volume lines (>10,000 units) to lowest price supplier',
    description: 'Captures bulk tier pricing across high-demand SKUs'
  },
  {
    label: '3-Ply Carton Optimization',
    icon: '📦',
    query: 'Optimize award allocation for 3-ply carton requirements',
    description: 'Focuses strictly on lighter-weight tertiary packaging'
  },
  {
    label: 'Least-Cost Unconstrained',
    icon: '💰',
    query: 'Find the absolute cheapest vendor per line across all 5 suppliers',
    description: 'Pure cherry-picked mathematical floor across all lines'
  }
];

export function NLInterrogate({ onGoToComparison, onGoToTrust }: NLInterrogateProps) {
  const [query, setQuery] = useState('What if we split cheapest per line among ISO 9001 certified vendors?');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMemo, setCopiedMemo] = useState(false);

  const [activeResult, setActiveResult] = useState<{
    question: string;
    operation: InterrogateOperation;
    mathResult: MathExecutionResult;
    memo: string;
  } | null>(null);

  // Automatically run the first default query on initial mount
  useEffect(() => {
    runInterrogation('What if we split cheapest per line among ISO 9001 certified vendors?');
  }, []);

  async function runInterrogation(questionToAsk?: string) {
    const q = (questionToAsk || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setCopiedMemo(false);

    try {
      const res = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Interrogation failed');
      }

      setActiveResult(json.data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error processing interrogation query');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyMemo() {
    if (!activeResult?.memo) return;
    navigator.clipboard.writeText(activeResult.memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>SLICE 7 • PLAIN LANGUAGE INTERROGATION ENGINE</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              Procurement Interrogation &amp; Boardroom-Ready Award Memo
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Ask arbitrary scenario questions in plain English. The engine parses the query into a typed mathematical AST, 
              executes deterministic calculations in TypeScript, and generates an auditable award memo.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>0% Hallucinated Math</span>
            </span>
          </div>
        </div>

        {/* Query Input Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runInterrogation()}
              placeholder="Ask a procurement question (e.g. What if we split cheapest per line among ISO certified vendors?)..."
              className="w-full h-11 pl-4 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <button
            onClick={() => runInterrogation()}
            disabled={loading || !query.trim()}
            className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center space-x-2 transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Interrogating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-500 font-medium mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Preset Scenarios:</span>
          </span>
          {PRESET_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p.query);
                runInterrogation(p.query);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors flex items-center space-x-1.5"
            >
              <span>{p.icon}</span>
              <span className="font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Parsing AST &amp; calculating deterministic line allocations...</p>
        </div>
      )}

      {/* Results View */}
      {!loading && activeResult && (
        <div className="space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                <span>Scenario Spend</span>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-purple-400">
                ₹{(activeResult.mathResult.totalSpendINR / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                ₹{activeResult.mathResult.totalSpendINR.toLocaleString()} total
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Single-Source Baseline</span>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-slate-300">
                ₹{(activeResult.mathResult.baselineSpendINR / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-slate-500">
                100% Shakti single-award
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 bg-emerald-500/5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Savings</span>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
                ₹{(activeResult.mathResult.savingsINR / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono font-bold">
                {activeResult.mathResult.savingsPercent}% cost reduction
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-orange-400" />
                <span>Suppliers Awarded</span>
              </div>
              <div className="text-xl md:text-2xl font-bold font-mono text-orange-400">
                {activeResult.mathResult.vendorAllocations.length} / 5
              </div>
              <div className="text-[10px] text-slate-500">
                {activeResult.mathResult.lineAwards.length} lines allocated
              </div>
            </div>

          </div>

          {/* Supplier Volume Allocation Bars */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Supplier Award Allocation &amp; Volume Share</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Deterministic line-by-line distribution
              </span>
            </div>

            <div className="space-y-2.5">
              {activeResult.mathResult.vendorAllocations.map(alloc => (
                <div key={alloc.vendorId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{alloc.vendorName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {alloc.lineCount} {alloc.lineCount === 1 ? 'line' : 'lines'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono">
                      <span className="text-slate-400">₹{(alloc.totalSpendINR / 100000).toFixed(2)}L</span>
                      <span className="font-bold text-purple-400">{alloc.spendSharePercent}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-orange-500 rounded-full"
                      style={{ width: `${Math.max(2, alloc.spendSharePercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Ineligible Vendors Callout if any */}
            {activeResult.mathResult.ineligibleVendors.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-amber-400 font-bold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Disqualified from scenario:</span>
                </span>
                {activeResult.mathResult.ineligibleVendors.map((inv, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    <strong className="text-slate-300">{inv.vendorId}</strong>: {inv.reason}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Executive Award Memo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Executive Award Recommendation Memo
                </h3>
              </div>
              <button
                onClick={handleCopyMemo}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                {copiedMemo ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Memo</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-sans text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap">
              {activeResult.memo}
            </div>

            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>Scenario: {activeResult.operation.scenarioTitle}</span>
              <span className="text-emerald-400 font-bold">Ready for Boardroom / Procurement Committee</span>
            </div>
          </div>

          {/* Awarded Line Items Breakdown Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Line-Item Allocation Table ({activeResult.mathResult.lineAwards.length} Items)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every winning unit price is backed by the vendor's source document.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5">Line</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-3 py-2.5">Ply</th>
                    <th className="px-4 py-2.5 text-right">Demand Qty</th>
                    <th className="px-4 py-2.5">Awarded Vendor</th>
                    <th className="px-4 py-2.5 text-right">Awarded Rate</th>
                    <th className="px-4 py-2.5 text-right">Extended Spend</th>
                    <th className="px-4 py-2.5 text-right">Savings</th>
                    <th className="px-4 py-2.5">Source Doc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeResult.mathResult.lineAwards.map((award) => (
                    <tr key={award.lineNo} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2 text-slate-400 font-bold">#{award.lineNo}</td>
                      <td className="px-4 py-2 font-sans font-medium text-slate-200">
                        {award.description}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1 rounded text-[10px] font-bold ${
                          award.ply === 3 ? 'bg-blue-500/10 text-blue-400' :
                          award.ply === 5 ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-purple-500/10 text-purple-400'
                        }`}>
                          {award.ply}P
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-300">
                        {award.qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-sans font-bold text-orange-400">
                        {award.awardedVendorName}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-400">
                        ₹{award.awardedUnitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-200 font-bold">
                        ₹{award.extendedCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-400 font-bold">
                        {award.lineSavingsINR > 0 ? `+₹${award.lineSavingsINR.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {award.sourceDoc}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
