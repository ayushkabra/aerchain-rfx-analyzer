'use client';

import React from 'react';
import { Layers, ShieldCheck, Sparkles, CheckCircle2, FileSpreadsheet, LayoutGrid, FileEdit } from 'lucide-react';

interface NavbarProps {
  rfxId?: string;
  category?: string;
  activeTab: 'rfx' | 'vendors' | 'comparison' | 'trust' | 'interrogate' | 'draft';
  setActiveTab: (tab: 'rfx' | 'vendors' | 'comparison' | 'trust' | 'interrogate' | 'draft') => void;
}

export function Navbar({ rfxId = 'RFX-2026-CORR-001', category = 'Corrugated Packaging', activeTab, setActiveTab }: NavbarProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Category */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-white text-lg tracking-wider">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-base tracking-tight">Aerchain RFx Analyzer</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SLICES 1–8 COMPLETE
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {rfxId} <span className="text-slate-600">•</span> {category}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('rfx')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'rfx'
                  ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>1. RFx Specification</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'vendors'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>2–3. Vendor Intake (5 Formats)</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'comparison'
                  ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>4–5. Comparison Matrix</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('trust')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'trust'
                  ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>6. Trust UX</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('interrogate')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'interrogate'
                  ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>7. Interrogate</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'draft'
                  ? 'bg-slate-800 text-purple-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <FileEdit className="w-3.5 h-3.5" />
                <span>8. Draft Co-Pilot</span>
              </span>
            </button>
          </nav>

          {/* Status pill */}
          <div className="hidden sm:flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1.5 text-emerald-400" />
              Matrix Ready
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
