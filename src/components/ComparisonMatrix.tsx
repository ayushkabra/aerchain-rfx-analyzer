'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Comparison, ComparisonRow, ComparisonCell } from '@/types/schema';
import { 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  TrendingDown, 
  HelpCircle, 
  Layers, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Camera, 
  Mail, 
  SlidersHorizontal, 
  Info, 
  Check, 
  AlertCircle, 
  X, 
  Edit3,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Percent,
  RefreshCw
} from 'lucide-react';

export function ComparisonMatrix() {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI Controls
  const [fxRate, setFxRate] = useState<number>(85.0);
  const [displayMode, setDisplayMode] = useState<'unit' | 'extended'>('unit');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPly, setSelectedPly] = useState<number | 'all'>('all');
  const [visibleVendors, setVisibleVendors] = useState<Record<string, boolean>>({
    vendor1_shakti: true,
    vendor2_everest: true,
    vendor3_metro: true,
    vendor4_rajdhani: true,
    vendor5_gupta: true,
  });

  // Provenance Side Drawer State
  const [activeCell, setActiveCell] = useState<{
    cell: ComparisonCell;
    lineDesc: string;
    qty: number;
    weight: number;
  } | null>(null);

  // Manual Override State
  const [overrides, setOverrides] = useState<Record<string, { price: number; reason: string }>>({});
  const [editPrice, setEditPrice] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  async function loadComparison(rate = fxRate) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fxRate: rate, manualOverrides: overrides }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load comparison');
      setComparison(json.data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error loading comparison matrix');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComparison();
  }, [overrides]);

  function handleFxRateChange(newRate: number) {
    setFxRate(newRate);
    loadComparison(newRate);
  }

  function handleSaveOverride() {
    if (!activeCell) return;
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const key = `${activeCell.cell.vendorId}_${activeCell.cell.lineNo}`;
    setOverrides(prev => ({
      ...prev,
      [key]: {
        price: priceNum,
        reason: editReason || 'Buyer commercial adjustment'
      }
    }));
    setActiveCell(null);
  }

  function handleResetOverride(vendorId: string, lineNo: number) {
    const key = `${vendorId}_${lineNo}`;
    setOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setActiveCell(null);
  }

  // Filter rows
  const filteredRows = useMemo(() => {
    if (!comparison) return [];
    return comparison.rows.filter(row => {
      const item = row.lineItem;
      const matchesSearch = 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dims_mm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lineNo.toString() === searchTerm.trim();
      const matchesPly = selectedPly === 'all' || item.ply === selectedPly;
      return matchesSearch && matchesPly;
    });
  }, [comparison, searchTerm, selectedPly]);

  if (loading && !comparison) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">
          Normalizing vendor quotes across RFx lines (USD→INR, UOM ÷100, Tare Wt × kg)...
        </p>
      </div>
    );
  }

  if (error && !comparison) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-xl mx-auto text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-red-200">Failed to Load Comparison Matrix</h3>
        <p className="text-xs text-red-300 font-mono">{error}</p>
        <button
          onClick={() => loadComparison()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!comparison) return null;

  return (
    <div className="space-y-6 relative">
      
      {/* Top Intelligence & Spend Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-orange-400 mb-1">
              <span>SLICES 4–5 • DETERMINISTIC NORMALIZATION MATRIX</span>
              <span>•</span>
              <span>30 RFX LINES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Side-by-Side Commercial Comparison
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              All 5 vendor responses converted deterministically into <strong>INR (₹) per box</strong>. 
              Click any price to inspect original source coordinates, formulas applied, or input an audit override.
            </p>
          </div>

          {/* Savings KPI Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-right min-w-[140px]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Single-Vendor Best</div>
              <div className="text-lg font-bold text-slate-200 font-mono">
                ₹{((comparison.singleVendorBestSpend || 0) / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-slate-500">Shakti Full Spend</div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl px-4 py-3 text-right min-w-[140px]">
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold flex items-center justify-end space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Line-Item Split</span>
              </div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                ₹{((comparison.cheapestCherryPickedSpend || 0) / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-emerald-500 font-semibold">
                Save {comparison.potentialSavingsPercent}% vs Best Single
              </div>
            </div>
          </div>
        </div>

        {/* Assumptions Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium">FX Assumption:</span>
              <span className="font-mono font-bold text-orange-400">$1 USD =</span>
              <input
                type="number"
                step="0.5"
                value={fxRate}
                onChange={(e) => handleFxRateChange(parseFloat(e.target.value) || 85.0)}
                className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-center font-mono font-bold text-slate-100 text-xs focus:outline-none focus:border-orange-500"
              />
              <span className="font-mono text-slate-400">INR</span>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-slate-400 text-[11px]">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Conversions: Everest USD→INR • Metro /100 • Gupta tare kg × rate + plate</span>
            </div>
          </div>

          {/* Display Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDisplayMode('unit')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                displayMode === 'unit' ? 'bg-slate-800 text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unit Price (₹/box)
            </button>
            <button
              onClick={() => setDisplayMode('extended')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                displayMode === 'extended' ? 'bg-slate-800 text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Extended Spend (₹)
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Vendor Selectors Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by description, size, or line #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 3, 5, 7, 9] as const).map(ply => (
              <button
                key={ply}
                onClick={() => setSelectedPly(ply)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-lg transition-colors ${
                  selectedPly === ply ? 'bg-slate-800 text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ply === 'all' ? 'All' : `${ply}P`}
              </button>
            ))}
          </div>
        </div>

        {/* Vendor Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-medium mr-1">Vendors:</span>
          {comparison.vendors.map(v => (
            <button
              key={v.vendorId}
              onClick={() => setVisibleVendors(prev => ({ ...prev, [v.vendorId]: !prev[v.vendorId] }))}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all border ${
                visibleVendors[v.vendorId]
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-950 text-slate-600 border-slate-900 line-through'
              }`}
            >
              {v.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Main Vendor Header */}
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                <th className="py-3 px-3 w-10 text-center font-mono">#</th>
                <th className="py-3 px-4 min-w-[240px]">
                  <div className="font-bold text-slate-200">RFx Line Item Specification</div>
                  <div className="text-[10px] text-slate-500 font-normal">Ply • Size • Dimensions • Annual Demand</div>
                </th>

                {/* 5 Vendor Headers */}
                {comparison.vendors.map(vendor => {
                  if (!visibleVendors[vendor.vendorId]) return null;
                  return (
                    <th key={vendor.vendorId} className="py-3 px-3 min-w-[155px] border-l border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 truncate">{vendor.name.split(' ')[0]}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono bg-slate-800 text-slate-400">
                          {vendor.sourceFormat}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono font-semibold mt-0.5">
                        ₹{(vendor.totalSpendINR / 100000).toFixed(2)}L
                        <span className="text-slate-500 font-normal text-[10px] ml-1">
                          ({vendor.linesQuoted}/{vendor.linesTotal} lines)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {vendor.complianceScore}% questionnaire pass
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRows.map(row => {
                const item = row.lineItem;
                const isPrinted = item.description.toLowerCase().includes('printed');

                return (
                  <tr key={item.lineNo} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Line No */}
                    <td className="py-2.5 px-3 text-center text-slate-500 group-hover:text-orange-400 font-medium">
                      {item.lineNo}
                    </td>

                    {/* Description & Specs */}
                    <td className="py-2.5 px-4 font-sans">
                      <div className="font-semibold text-slate-200 line-clamp-1">{item.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-2 mt-0.5">
                        <span className={`px-1 rounded text-[9px] font-bold ${
                          item.ply === 3 ? 'bg-blue-500/10 text-blue-400' :
                          item.ply === 5 ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-purple-500/10 text-purple-400'
                        }`}>
                          {item.ply}P
                        </span>
                        <span>{item.dims_mm}mm</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-300">{item.qty.toLocaleString()} {item.uom}s</span>
                        <span>•</span>
                        <span>{item.weight_kg_per_box}kg</span>
                      </div>
                    </td>

                    {/* Vendor Cells */}
                    {comparison.vendors.map(vendor => {
                      if (!visibleVendors[vendor.vendorId]) return null;
                      const cell = row.cells[vendor.vendorId];
                      if (!cell) return <td key={vendor.vendorId} className="border-l border-slate-800/80 px-3 py-2 text-center text-slate-600">—</td>;

                      const isMissing = cell.coverage === 'missing' || cell.unitPriceNormalized === null;
                      const isAmbiguous = cell.coverage === 'ambiguous';
                      const isLowest = cell.isLowestPrice && !isMissing;
                      const conf = Math.round(cell.confidence * 100);

                      // Display value based on mode
                      const displayVal = displayMode === 'unit'
                        ? (cell.effectiveUnitPrice !== null ? `₹${cell.effectiveUnitPrice.toFixed(2)}` : '—')
                        : (cell.effectiveExtendedCost !== null ? `₹${(cell.effectiveExtendedCost / 1000).toFixed(1)}k` : '—');

                      return (
                        <td 
                          key={vendor.vendorId}
                          onClick={() => setActiveCell({ cell, lineDesc: item.description, qty: item.qty, weight: item.weight_kg_per_box })}
                          className={`border-l border-slate-800/80 px-3 py-2 cursor-pointer transition-all ${
                            isLowest ? 'bg-emerald-500/10' :
                            isMissing ? 'bg-slate-950/40' :
                            'hover:bg-slate-800/50'
                          }`}
                        >
                          {isMissing ? (
                            <div className="flex items-center space-x-1.5 text-slate-600">
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                                Omitted
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${
                                  isLowest ? 'text-emerald-400 font-extrabold' : 'text-slate-100'
                                }`}>
                                  {displayVal}
                                </span>
                                {isLowest && (
                                  <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-400">
                                    LOW
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                                <span className="truncate max-w-[80px]">
                                  {cell.currencyOriginal === 'USD' ? `$${cell.unitPriceOriginal?.toFixed(3)}` :
                                   cell.uomOriginal === 'per_100' ? `₹${cell.unitPriceOriginal}/100` :
                                   cell.uomOriginal === 'per_kg' ? `₹${cell.unitPriceOriginal}/kg` :
                                   `₹${cell.unitPriceOriginal}`}
                                </span>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  conf >= 85 ? 'bg-emerald-400' :
                                  conf >= 60 ? 'bg-amber-400' :
                                  'bg-red-400'
                                }`} title={`${conf}% confidence`} />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROVENANCE & AUDIT OVERRIDE DRAWER (TRUST UX) */}
      {activeCell && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-sm text-slate-100">Cell Provenance &amp; Trust Audit</h3>
            </div>
            <button
              onClick={() => setActiveCell(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 space-y-5 text-xs">
            {/* Line Summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Line Item #{activeCell.cell.lineNo}
              </div>
              <div className="font-bold text-slate-200">{activeCell.lineDesc}</div>
              <div className="text-slate-400 font-mono">
                Demand: {activeCell.qty.toLocaleString()} units • Unit Wt: {activeCell.weight} kg
              </div>
            </div>

            {/* Vendor & Normalized Commercials */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Vendor</div>
                <div className="font-bold text-slate-200 text-sm mt-0.5">{activeCell.cell.vendorName}</div>
                <div className="text-slate-400 text-[11px] font-mono">Doc: {activeCell.cell.source.doc}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Normalized Price</div>
                <div className="font-bold text-emerald-400 text-base font-mono mt-0.5">
                  {activeCell.cell.effectiveUnitPrice !== null ? `₹${activeCell.cell.effectiveUnitPrice.toFixed(2)}/box` : 'Omitted'}
                </div>
                <div className="text-slate-400 text-[10px] font-mono">
                  Extended: ₹{(activeCell.cell.effectiveExtendedCost || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Provenance Source Pointer */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                <span>Exact Source Location &amp; Verbatim Snippet</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-1.5">
                <div className="text-orange-400 font-bold text-[11px]">
                  Location: {activeCell.cell.source.locationHint}
                </div>
                <div className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                  "{activeCell.cell.source.snippet}"
                </div>
              </div>
            </div>

            {/* Assumptions Applied */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Deterministic Normalization Trail
              </div>
              <div className="space-y-1.5">
                {activeCell.cell.assumptionsApplied.map((assump, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                    • {assump}
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Override */}
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-3">
              <div className="flex items-center space-x-1.5 text-orange-400 font-bold">
                <Edit3 className="w-4 h-4" />
                <span>Buyer Manual Override (Audit Trail Preserved)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Need to negotiate or override this cell rate? Input the approved rate and reason. The original extracted value is permanently preserved.
              </p>
              
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Override Rate (INR / Box)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={activeCell.cell.effectiveUnitPrice?.toFixed(2) || '0.00'}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Audit Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Negotiated 5% discount via phone call"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={handleSaveOverride}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-xs"
                  >
                    Apply Override
                  </button>
                  {overrides[`${activeCell.cell.vendorId}_${activeCell.cell.lineNo}`] && (
                    <button
                      onClick={() => handleResetOverride(activeCell.cell.vendorId, activeCell.cell.lineNo)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                    >
                      Reset to Original
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
