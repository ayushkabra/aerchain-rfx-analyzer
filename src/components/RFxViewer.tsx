'use client';

import React, { useState, useMemo } from 'react';
import { RFx } from '@/types/schema';
import { MetricCard } from './MetricCard';
import { 
  Package, 
  Scale, 
  HelpCircle, 
  Search, 
  Filter, 
  FileCheck2, 
  ArrowRight,
  Info,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

interface RFxViewerProps {
  rfx: RFx;
  onProceedToSlice2?: () => void;
}

export function RFxViewer({ rfx, onProceedToSlice2 }: RFxViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [plyFilter, setPlyFilter] = useState<number | 'all'>('all');
  const [sizeFilter, setSizeFilter] = useState<string | 'all'>('all');
  const [finishFilter, setFinishFilter] = useState<'all' | 'plain' | 'printed'>('all');

  // Metrics calculations
  const totalVolume = useMemo(() => {
    return rfx.lineItems.reduce((acc, item) => acc + item.qty, 0);
  }, [rfx.lineItems]);

  const totalWeightTonnes = useMemo(() => {
    const totalKg = rfx.lineItems.reduce((acc, item) => acc + (item.qty * item.weight_kg_per_box), 0);
    return (totalKg / 1000).toFixed(1);
  }, [rfx.lineItems]);

  // Filtered line items
  const filteredItems = useMemo(() => {
    return rfx.lineItems.filter((item) => {
      // Search
      const matchesSearch = 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dims_mm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lineNo.toString().includes(searchTerm);

      // Ply
      const matchesPly = plyFilter === 'all' || item.ply === plyFilter;

      // Size
      const matchesSize = sizeFilter === 'all' || item.size === sizeFilter;

      // Finish (Plain vs Printed)
      const isPrinted = item.description.toLowerCase().includes('printed');
      const matchesFinish = 
        finishFilter === 'all' ||
        (finishFilter === 'printed' && isPrinted) ||
        (finishFilter === 'plain' && !isPrinted);

      return matchesSearch && matchesPly && matchesSize && matchesFinish;
    });
  }, [rfx.lineItems, searchTerm, plyFilter, sizeFilter, finishFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-orange-400 mb-1.5">
              <span>{rfx.id}</span>
              <span>•</span>
              <span>{rfx.buyer || 'Nimbus Consumer Pvt Ltd — Procurement'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {rfx.title}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Canonical rate contract defining 24 SKU line items across 3-ply, 5-ply, and 7-ply corrugated boxes, 
              complete with dimensional footprints and tare weights for deterministic unit-of-measure conversions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-right">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Standard Unit</div>
              <div className="text-sm font-bold text-slate-200">INR per box</div>
            </div>
            <button
              onClick={onProceedToSlice2}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all shadow-lg shadow-orange-600/20 active:scale-95"
            >
              <span>Slice 2: Extract Excel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Annual Volume"
          value={totalVolume.toLocaleString()}
          subValue="24 SKU line items across 4 box sizes"
          icon={<Package className="w-4 h-4" />}
          badge="3-ply, 5-ply, 7-ply"
          badgeColor="orange"
        />
        <MetricCard
          label="Estimated Kraft Tonnage"
          value={`${totalWeightTonnes} MT`}
          subValue="Cumulative packaging weight"
          icon={<Scale className="w-4 h-4" />}
          badge="Tare Basis"
          badgeColor="emerald"
        />
        <MetricCard
          label="Mandatory Criteria"
          value={`${rfx.questionnaire.length} Gating Questions`}
          subValue="ISO 9001, Payment, Lead Time, Recycled %"
          icon={<HelpCircle className="w-4 h-4" />}
          badge="Compliance"
          badgeColor="blue"
        />
        <MetricCard
          label="Target Pricing Unit"
          value="INR (₹) / Box"
          subValue="Ex-Works Pune / NCR delivery"
          icon={<FileCheck2 className="w-4 h-4" />}
          badge="Deterministic"
          badgeColor="purple"
        />
      </div>

      {/* Main Content: Line Items Table & Questionnaire */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Line Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by description, dimensions (e.g. 310x220)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              {/* Ply filter pills */}
              <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 px-2 font-medium">Ply:</span>
                {(['all', 3, 5, 7] as const).map((ply) => (
                  <button
                    key={ply}
                    onClick={() => setPlyFilter(ply)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                      plyFilter === ply
                        ? 'bg-slate-800 text-orange-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ply === 'all' ? 'All' : `${ply}P`}
                  </button>
                ))}
              </div>

              {/* Print filter pills */}
              <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                {(['all', 'plain', 'printed'] as const).map((finish) => (
                  <button
                    key={finish}
                    onClick={() => setFinishFilter(finish)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg capitalize transition-colors ${
                      finishFilter === finish
                        ? 'bg-slate-800 text-orange-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {finish}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Description & Dimensions</th>
                    <th className="py-2.5 px-3 text-center">Ply</th>
                    <th className="py-2.5 px-3 text-center">Size</th>
                    <th className="py-2.5 px-3 text-right">Unit Wt.</th>
                    <th className="py-2.5 px-3 text-right">Annual Qty</th>
                    <th className="py-2.5 px-3 text-right">Extended Wt.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const isPrinted = item.description.toLowerCase().includes('printed');
                    const extWeightKg = (item.qty * item.weight_kg_per_box);
                    return (
                      <tr 
                        key={item.lineNo} 
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 group-hover:text-orange-400 font-medium">
                          {item.lineNo}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-200">{item.description}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-2 mt-0.5">
                            <span>Dims: {item.dims_mm} mm</span>
                            {isPrinted && (
                              <span className="text-[9px] px-1 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                                2-Col Flexo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.ply === 3 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            item.ply === 5 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {item.ply}-ply
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-300">
                          {item.size}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          <span>{item.weight_kg_per_box.toFixed(2)} kg</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100">
                          {item.qty.toLocaleString()} {item.uom}s
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {(extWeightKg / 1000).toFixed(2)} MT
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No line items matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredItems.length} of {rfx.lineItems.length} line items</span>
              <span className="flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Unit weights are used in Slice 4 to normalize Gupta's ₹/kg quotes to ₹/box.</span>
              </span>
            </div>

          </div>
        </div>

        {/* Right Col: Questionnaire & Commercial Rules */}
        <div className="space-y-4">
          
          {/* Questionnaire Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <HelpCircle className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Vendor Questionnaire
              </h2>
            </div>
            
            <p className="text-xs text-slate-400">
              All 5 vendors are required to answer these 4 gating questions. Responses will be extracted and scored in Slice 2–3.
            </p>

            <div className="space-y-3">
              {rfx.questionnaire.map((q, index) => (
                <div key={q.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-mono font-bold text-orange-400">Q{index + 1} ({q.id})</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                      Type: {q.type}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-200">
                    {q.question}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Canonical Terms Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Commercial Terms
              </h2>
            </div>
            
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
              "{rfx.terms}"
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div>• Base Currency: <strong className="text-slate-300">INR (₹)</strong></div>
              <div>• Target Delivery: <strong className="text-slate-300">Ex-works / DDP NCR</strong></div>
              <div>• Deviations: <strong className="text-amber-400">Everest (USD), Gupta (Freight Extra)</strong></div>
            </div>
          </div>

          {/* Slice 1 Verification Notice */}
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-orange-400">
              <CheckCircle className="w-4 h-4 text-orange-400" />
              <span>Slice 1 Checkpoint Ready</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Canonical RFx specification is rendered from <code className="text-orange-300 font-mono">/data/rfx.json</code>.
              Human can verify line count (24), weights, and criteria.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
