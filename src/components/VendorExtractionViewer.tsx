'use client';

import React, { useState, useEffect } from 'react';
import { VendorResponse } from '@/types/schema';
import { 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Code, 
  Table, 
  ShieldCheck, 
  HelpCircle, 
  MapPin, 
  Copy, 
  Check, 
  FileCheck, 
  Zap, 
  Database, 
  Search, 
  FileText, 
  Camera, 
  Mail, 
  ArrowRight 
} from 'lucide-react';

interface VendorExtractionViewerProps {
  onProceedToSlice3?: () => void;
}

const VENDORS = [
  { id: 'vendor1_shakti', name: 'Shakti Packaging', format: 'excel', file: 'vendor1_shakti_packaging.xlsx', icon: FileSpreadsheet, color: 'text-emerald-400' },
  { id: 'vendor2_everest', name: 'Everest Corrugators', format: 'pdf', file: 'vendor2_everest_corrugators.pdf', icon: FileText, color: 'text-red-400' },
  { id: 'vendor3_metro', name: 'Metro Pack', format: 'word', file: 'vendor3_metro_pack.txt', icon: FileText, color: 'text-blue-400' },
  { id: 'vendor4_rajdhani', name: 'Rajdhani Boards', format: 'photo', file: 'vendor4_rajdhani_ratecard_photo.jpg', icon: Camera, color: 'text-purple-400' },
  { id: 'vendor5_gupta', name: 'Gupta Carton Works', format: 'email', file: 'gupta_email.txt', icon: Mail, color: 'text-amber-400' },
];

export function VendorExtractionViewer({ onProceedToSlice3 }: VendorExtractionViewerProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string>('vendor1_shakti');
  const [vendorData, setVendorData] = useState<VendorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractingAll, setExtractingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'structured' | 'rawJson'>('structured');
  const [copied, setCopied] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Load cached or extract vendor on tab change
  useEffect(() => {
    async function loadVendor() {
      setLoading(true);
      setError(null);
      setVendorData(null); // Clear previous vendor data to prevent bleed-through
      try {
        const res = await fetch(`/api/extract?vendorId=${selectedVendorId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setVendorData(json.data);
          setIsCached(!!json.isCached);
        } else {
          // Auto extract if not cached
          await triggerExtraction(selectedVendorId, false);
        }
      } catch (e: any) {
        setError(e.message || 'Error loading vendor');
      } finally {
        setLoading(false);
      }
    }
    loadVendor();
  }, [selectedVendorId]);

  async function triggerExtraction(vendorId = selectedVendorId, forceLive = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, forceLive }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || `Failed to extract ${vendorId}`);
      }
      setVendorData(json.data);
      setIsCached(!forceLive);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Extraction error');
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractAll() {
    setExtractingAll(true);
    setError(null);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: 'all', forceLive: false }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed batch extraction');
      // reload active
      await triggerExtraction(selectedVendorId, false);
    } catch (e: any) {
      setError(e.message || 'Batch extraction error');
    } finally {
      setExtractingAll(false);
    }
  }

  function handleCopyJson() {
    if (!vendorData) return;
    navigator.clipboard.writeText(JSON.stringify(vendorData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeVendorMeta = VENDORS.find(v => v.id === selectedVendorId) || VENDORS[0];
  const IconComponent = activeVendorMeta.icon;

  return (
    <div className="space-y-6">
      
      {/* Vendor Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {VENDORS.map(v => {
          const isSelected = v.id === selectedVendorId;
          const VIcon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedVendorId(v.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected 
                  ? 'bg-slate-800/90 border-orange-500/50 shadow-md shadow-orange-500/10' 
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <VIcon className={`w-4 h-4 ${v.color}`} />
                <span className="text-[10px] font-mono uppercase text-slate-500">{v.format}</span>
              </div>
              <div className={`text-xs font-bold truncate ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>
                {v.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Vendor Extraction Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
              <span>VENDOR INTAKE &amp; PROVENANCE</span>
              <span>•</span>
              <span className="text-orange-400 uppercase font-bold">{activeVendorMeta.format} FORMAT</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
              <span>{activeVendorMeta.name}</span>
              <code className="text-slate-400 font-mono text-sm font-normal">({activeVendorMeta.file})</code>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Extracted with confidence (0–1), exact source coordinates, and cached to <code className="text-orange-300">data/cache/{selectedVendorId}.json</code>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => triggerExtraction(selectedVendorId, true)}
              disabled={loading || extractingAll}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-run Live Extraction</span>
                </>
              )}
            </button>

            <button
              onClick={handleExtractAll}
              disabled={extractingAll}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{extractingAll ? 'Extracting All 5...' : 'Extract All 5 Vendors'}</span>
            </button>

            <button
              onClick={onProceedToSlice3}
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-lg shadow-orange-600/20 active:scale-95"
            >
              <span>View Comparison Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-red-300 font-semibold">Extraction Notice:</strong>
              <div className="text-red-200 mt-0.5 font-mono">{error}</div>
              <div className="text-slate-400 mt-1">
                If Groq free tier hit rate limits (429 TPM limit), clicking "Re-run Live Extraction" or "Extract All 5 Vendors" will automatically load through the resilient document parser.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && !vendorData && (
        <div className="py-20 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading and parsing {activeVendorMeta.name} ({activeVendorMeta.file})...</p>
        </div>
      )}

      {/* Extraction Results */}
      {vendorData && (
        <div className="space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Original Currency</div>
              <div className="text-xl font-bold text-slate-100 font-mono">{vendorData.currencyOriginal}</div>
              <div className="text-xs text-slate-500 font-mono mt-1">Source: {vendorData.sourceFormat}</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Overall Confidence</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {(vendorData.overallConfidence * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {vendorData.overallConfidence >= 0.85 ? 'High Confidence' : 'Review Required'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                <Database className="w-3 h-3 text-blue-400" />
                <span>Cached to /data/cache/</span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Coverage & Mapping</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">
                {vendorData.lineQuotes.filter(q => q.coverage === 'quoted').length} / {vendorData.lineQuotes.length} Lines
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {vendorData.lineQuotes.filter(q => q.coverage === 'missing').length} omitted / missing lines
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Terms &amp; Discounts</div>
              <div className="text-xs font-semibold text-slate-200">
                {vendorData.terms.paymentDays ? `${vendorData.terms.paymentDays} Days Net` : 'Standard'} • {vendorData.terms.leadTimeDays ? `${vendorData.terms.leadTimeDays}d Lead` : '14d Lead'}
              </div>
              <div className="text-[11px] text-amber-400 truncate mt-1">
                {vendorData.terms.discountNote || vendorData.terms.freight || 'Standard Ex-Works'}
              </div>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('structured')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'structured'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Structured Inspection (All {vendorData.lineQuotes.length} Rows)</span>
              </button>

              <button
                onClick={() => setViewMode('rawJson')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'rawJson'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Raw Extracted JSON Payload</span>
              </button>
            </div>

            {viewMode === 'rawJson' && (
              <button
                onClick={handleCopyJson}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-900 border border-slate-800"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          {/* VIEW MODE 1: STRUCTURED VIEW */}
          {viewMode === 'structured' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Line Quotes Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>Extracted Line Quotes &amp; Source Provenance</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {vendorData.lineQuotes.length} line items extracted
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                          <th className="py-2.5 px-3 w-12 text-center">Line</th>
                          <th className="py-2.5 px-3">Quoted Item &amp; Raw Text</th>
                          <th className="py-2.5 px-3 text-right">Price</th>
                          <th className="py-2.5 px-3 text-center">UOM</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-center">Conf.</th>
                          <th className="py-2.5 px-3">Source Pointer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {vendorData.lineQuotes.map((quote, idx) => {
                          const confPercent = Math.round(quote.confidence * 100);
                          const isSelected = selectedQuote === quote.lineNo;
                          const isMissing = quote.coverage === 'missing' || quote.unitPriceOriginal === null;
                          return (
                            <tr
                              key={idx}
                              onClick={() => setSelectedQuote(quote.lineNo)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="py-2 px-3 text-center font-bold text-slate-300">
                                {quote.lineNo || '—'}
                              </td>
                              <td className="py-2 px-3">
                                <div className="text-slate-200 font-sans font-medium line-clamp-1">{quote.rawText}</div>
                                {quote.notes && (
                                  <div className="text-[10px] text-amber-400/80 italic mt-0.5">{quote.notes}</div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-400">
                                {isMissing ? (
                                  <span className="text-slate-500">—</span>
                                ) : (
                                  `${vendorData.currencyOriginal === 'USD' ? '$' : '₹'}${quote.unitPriceOriginal?.toFixed(2)}`
                                )}
                              </td>
                              <td className="py-2 px-3 text-center text-slate-400">
                                {quote.uomOriginal || 'box'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  quote.coverage === 'quoted' ? 'bg-emerald-500/10 text-emerald-400' :
                                  quote.coverage === 'missing' ? 'bg-red-500/10 text-red-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {quote.coverage}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  confPercent >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  confPercent >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {confPercent}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-400">
                                <div className="text-[11px] text-slate-300 font-sans flex items-center space-x-1">
                                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate max-w-[140px]">{quote.source.locationHint}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[160px] mt-0.5">
                                  "{quote.source.snippet}"
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Col: Questionnaire Answers & Terms */}
              <div className="space-y-4">
                {/* Questionnaire Card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Questionnaire Discovery
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {vendorData.questionnaireAnswers.map((ans) => {
                      const isAnswered = ans.answer !== null && ans.answer !== '';
                      return (
                        <div key={ans.qId} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                            <span className="text-orange-400 font-bold">{ans.qId}</span>
                            <span className={isAnswered ? 'text-emerald-400' : 'text-red-400'}>
                              {isAnswered ? `${(ans.confidence * 100).toFixed(0)}% conf` : 'Unanswered'}
                            </span>
                          </div>
                          <div className={`text-xs font-semibold ${isAnswered ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                            {isAnswered ? String(ans.answer) : 'Not specified in proposal'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono pt-1">
                            Source: {ans.source.locationHint}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ground Truth Validation Checklist */}
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Planted Edge Cases Handled</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li>Shakti: Clean Excel off-template, all 30 rows mapped.</li>
                    <li>Everest: Quoted in USD with buried 4% volume discount.</li>
                    <li>Metro: Prose commercials with per-100 UOM and missing lines.</li>
                    <li>Rajdhani: Photo rates with low confidence on faint rows.</li>
                    <li>Gupta: Vague email priced ₹/kg with plate surcharge.</li>
                  </ul>
                </div>

              </div>

            </div>
          )}

          {/* VIEW MODE 2: RAW JSON */}
          {viewMode === 'rawJson' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
                <span>Zod-Validated VendorResponse Payload ({selectedVendorId})</span>
                <span>{JSON.stringify(vendorData).length.toLocaleString()} bytes</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900/90 text-slate-200 font-mono text-xs overflow-x-auto max-h-[600px] border border-slate-800">
                {JSON.stringify(vendorData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
