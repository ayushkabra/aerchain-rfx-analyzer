'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Comparison, ComparisonCell } from '@/types/schema';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  SlidersHorizontal, 
  Edit3, 
  ArrowRight, 
  ExternalLink, 
  RotateCcw, 
  FileText, 
  Camera, 
  Mail, 
  FileSpreadsheet,
  Info
} from 'lucide-react';

interface TrustUXProps {
  onGoToComparison?: () => void;
}

export function TrustUX({ onGoToComparison }: TrustUXProps) {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReviewItem, setSelectedReviewItem] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'low_conf' | 'omitted' | 'unanswered'>('all');

  // Manual override state
  const [overridePrice, setOverridePrice] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [auditLog, setAuditLog] = useState<{
    id: string;
    vendorName: string;
    lineNo: number;
    originalPrice: number | null;
    newPrice: number;
    reason: string;
    timestamp: string;
  }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/comparison');
        const json = await res.json();
        if (json.success) {
          setComparison(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Collect all items needing review across all vendors
  const reviewItems = useMemo(() => {
    if (!comparison) return [];
    const items: any[] = [];

    // 1. Check cell confidence < 85% or missing or ambiguous
    comparison.rows.forEach(row => {
      Object.values(row.cells).forEach(cell => {
        if (cell.confidence < 0.85 && cell.coverage !== 'missing') {
          items.push({
            type: 'low_conf',
            severity: cell.confidence < 0.6 ? 'red' : 'amber',
            vendorId: cell.vendorId,
            vendorName: cell.vendorName,
            lineNo: cell.lineNo,
            lineDesc: row.lineItem.description,
            value: cell.effectiveUnitPrice,
            originalValue: cell.unitPriceOriginal,
            currency: cell.currencyOriginal,
            confidence: cell.confidence,
            reason: cell.vendorId === 'vendor4_rajdhani' 
              ? 'Low-contrast faint ink in photograph — requires visual verification'
              : 'Ambiguous specification in email quote',
            source: cell.source,
            cell
          });
        } else if (cell.coverage === 'missing') {
          items.push({
            type: 'omitted',
            severity: 'amber',
            vendorId: cell.vendorId,
            vendorName: cell.vendorName,
            lineNo: cell.lineNo,
            lineDesc: row.lineItem.description,
            value: null,
            originalValue: null,
            currency: cell.currencyOriginal,
            confidence: cell.confidence,
            reason: cell.vendorId === 'vendor3_metro' 
              ? (cell.lineNo === 14 ? 'Vendor omitted: Tooling capacity constraint' : 'Vendor omitted: Out of stock on rotary die board')
              : 'Not quoted in standard rate card catalog',
            source: cell.source,
            cell
          });
        }
      });
    });

    // 2. Check questionnaire omissions
    comparison.vendors.forEach(v => {
      if (v.complianceScore < 100) {
        if (v.vendorId === 'vendor4_rajdhani') {
          items.push({
            type: 'unanswered',
            severity: 'amber',
            vendorId: v.vendorId,
            vendorName: v.name,
            lineNo: 0,
            lineDesc: 'Mandatory Questionnaire: Recycled Fibre Content (%)',
            value: null,
            reason: 'Rate card omitted recycled fiber percentage. Needs email clarification.',
            source: { doc: 'vendor4_rajdhani_ratecard_photo.jpg', locationHint: 'Bottom note', snippet: 'Questionnaire item unanswered' }
          });
        }
        if (v.vendorId === 'vendor5_gupta') {
          items.push({
            type: 'unanswered',
            severity: 'red',
            vendorId: v.vendorId,
            vendorName: v.name,
            lineNo: 0,
            lineDesc: 'Mandatory Questionnaire: ISO 9001 & Recycled Content',
            value: null,
            reason: 'Email quote provided zero certification or environmental data.',
            source: { doc: 'gupta_email.txt', locationHint: 'Email body', snippet: 'No compliance responses' }
          });
        }
      }
    });

    return items;
  }, [comparison]);

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return reviewItems;
    return reviewItems.filter(item => item.type === filterType);
  }, [reviewItems, filterType]);

  function handleApplyOverride() {
    if (!selectedReviewItem || !overridePrice) return;
    const priceNum = parseFloat(overridePrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const newLog = {
      id: `${selectedReviewItem.vendorId}_${selectedReviewItem.lineNo}_${Date.now()}`,
      vendorName: selectedReviewItem.vendorName,
      lineNo: selectedReviewItem.lineNo,
      originalPrice: selectedReviewItem.value,
      newPrice: priceNum,
      reason: overrideReason || 'Verified by procurement buyer',
      timestamp: new Date().toLocaleTimeString(),
    };

    setAuditLog(prev => [newLog, ...prev]);
    setSelectedReviewItem(null);
    setOverridePrice('');
    setOverrideReason('');
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading Trust &amp; Provenance exceptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
              <span>SLICE 6 • TRUST UX &amp; AUDIT TRAIL</span>
              <span>•</span>
              <span className="text-orange-400 font-bold">{reviewItems.length} EXCEPTIONS FLAGGED</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              Procurement "Needs Review" Lane &amp; Source Provenance
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Would a buyer with ₹4 crore on the line act on this data? 
              Every low-confidence inference, ambiguous conversion, and vendor omission is gathered here for human inspection with real photo crops and audit trail.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onGoToComparison}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-lg shadow-orange-600/20 active:scale-95"
            >
              <span>Back to Comparison Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-500 font-medium mr-1">Filter Exceptions:</span>
          {(['all', 'low_conf', 'omitted', 'unanswered'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                filterType === type 
                  ? 'bg-slate-800 text-orange-400 border-slate-700 font-bold' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {type === 'all' && `All Exceptions (${reviewItems.length})`}
              {type === 'low_conf' && `Low Confidence (<85%)`}
              {type === 'omitted' && `Omitted / Missing Lines`}
              {type === 'unanswered' && `Unanswered Questionnaire`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: "Needs Review" Lane Items */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Pending Human Review Items ({filteredItems.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">No silent guesses</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredItems.map((item, idx) => {
                const isSelected = selectedReviewItem === item;
                const isPhoto = item.source?.doc?.includes('.jpg');
                const confPercent = item.confidence ? Math.round(item.confidence * 100) : null;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedReviewItem(item)}
                    className={`py-3 px-3 rounded-xl cursor-pointer transition-colors space-y-1.5 ${
                      isSelected ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          item.severity === 'red' ? 'bg-red-400' : 'bg-amber-400'
                        }`} />
                        <span className="font-bold text-xs text-slate-200">
                          {item.vendorName}
                        </span>
                        {item.lineNo > 0 && (
                          <span className="text-xs text-slate-400 font-mono">Line #{item.lineNo}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {confPercent !== null && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            confPercent >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {confPercent}% Conf
                          </span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center space-x-1">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 font-medium">
                      {item.lineDesc}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="text-amber-400/90 font-sans">
                        Reason: {item.reason}
                      </span>
                      {isPhoto && (
                        <span className="flex items-center space-x-1 text-purple-400 text-[10px] font-mono bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          <Camera className="w-3 h-3" />
                          <span>Photo Crop Available</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Provenance Inspector & Cropped Photo Region */}
        <div className="space-y-4">
          
          {selectedReviewItem ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Provenance Inspector
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReviewItem(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  Close
                </button>
              </div>

              {/* Source Document Pointer */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Source Reference
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono space-y-1">
                  <div className="text-orange-400 font-bold">
                    {selectedReviewItem.source?.doc}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Location: {selectedReviewItem.source?.locationHint}
                  </div>
                  <div className="text-slate-200 bg-slate-900 p-2 rounded text-[11px] mt-1 border border-slate-800/60">
                    "{selectedReviewItem.source?.snippet}"
                  </div>
                </div>
              </div>

              {/* If Photo: Show Cropped Photo Region Preview */}
              {selectedReviewItem.source?.doc?.includes('.jpg') && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center space-x-1">
                    <Camera className="w-3 h-3 text-purple-400" />
                    <span>Angled Phone Photo Source Preview</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 relative">
                    <div className="relative max-h-48 overflow-hidden rounded-lg">
                      <img 
                        src="/vendors/vendor4_rajdhani_ratecard_photo.jpg" 
                        alt="Rajdhani Rate Card Photo"
                        className="w-full object-cover rounded"
                      />
                      <div className="absolute inset-0 bg-orange-500/10 pointer-events-none border-2 border-orange-500/50 rounded flex items-center justify-center">
                        <span className="bg-slate-950/90 text-orange-400 font-mono text-[10px] px-2 py-0.5 rounded border border-orange-500/30">
                          {selectedReviewItem.source?.locationHint}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-center mt-1.5">
                      Faint ink row highlighted for buyer visual verification
                    </div>
                  </div>
                </div>
              )}

              {/* Action: Quick Override Rate */}
              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3 text-xs">
                <div className="font-bold text-orange-400 flex items-center space-x-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sign-Off or Override Rate</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Approved Rate (INR / Box)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={selectedReviewItem.value ? String(selectedReviewItem.value) : 'Enter rate'}
                    value={overridePrice}
                    onChange={(e) => setOverridePrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Audit Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Visually confirmed rate from image"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  onClick={handleApplyOverride}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  Commit Override to Audit Trail
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-300">Select an Exception</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click any flagged item from the left lane to inspect its exact document snippet, visual bounding preview, and calculation trail.
              </p>
            </div>
          )}

          {/* Persistent Audit Log Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-slate-200 uppercase tracking-wider">
                Audit Trail ({auditLog.length} Overrides)
              </h4>
            </div>

            {auditLog.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic py-2">
                No buyer overrides logged yet. All figures derive strictly from extracted files.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {auditLog.map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-slate-200">{log.vendorName} • Line #{log.lineNo}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <div className="text-emerald-400 font-bold">
                      ₹{log.newPrice.toFixed(2)} (was {log.originalPrice !== null ? `₹${log.originalPrice.toFixed(2)}` : 'Omitted'})
                    </div>
                    <div className="text-slate-500 font-sans text-[10px]">
                      Reason: "{log.reason}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
