'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { RFxViewer } from '@/components/RFxViewer';
import { VendorExtractionViewer } from '@/components/VendorExtractionViewer';
import { ComparisonMatrix } from '@/components/ComparisonMatrix';
import { TrustUX } from '@/components/TrustUX';
import { NLInterrogate } from '@/components/NLInterrogate';
import { RFxDraftCopilot } from '@/components/RFxDraftCopilot';
import { RFx } from '@/types/schema';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'rfx' | 'vendors' | 'comparison' | 'trust' | 'interrogate' | 'draft'>('rfx');
  const [rfx, setRfx] = useState<RFx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRFx() {
      try {
        const res = await fetch('/api/rfx');
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch RFx');
        }
        setRfx(json.data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading RFx');
      } finally {
        setLoading(false);
      }
    }
    loadRFx();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        rfxId={rfx?.id || 'RFX-2026-CORR-001'}
        category={rfx?.category || 'Corrugated Packaging'}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 font-mono">Loading canonical RFx from /data/rfx.json...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-xl mx-auto text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-red-200">Failed to Load RFx Data</h3>
            <p className="text-xs text-red-300 font-mono">{error}</p>
          </div>
        )}

        {!loading && !error && rfx && (
          <>
            {/* TAB 1: Canonical RFx Specification (Slice 1) */}
            {activeTab === 'rfx' && (
              <RFxViewer
                rfx={rfx}
                onProceedToSlice2={() => setActiveTab('vendors')}
              />
            )}

            {/* TAB 2: Vendor Extraction (Slice 2 & 3: All 5 Vendors) */}
            {activeTab === 'vendors' && (
              <VendorExtractionViewer
                onProceedToSlice3={() => setActiveTab('comparison')}
              />
            )}

            {/* TAB 3: Comparison Matrix (Slice 4 & 5: All 5 Vendors Side-by-Side) */}
            {activeTab === 'comparison' && (
              <ComparisonMatrix />
            )}

            {/* TAB 4: Trust UX & Needs Review Lane (Slice 6) */}
            {activeTab === 'trust' && (
              <TrustUX onGoToComparison={() => setActiveTab('comparison')} />
            )}

            {/* TAB 5: Plain Language Interrogation (Slice 7) */}
            {activeTab === 'interrogate' && (
              <NLInterrogate 
                onGoToComparison={() => setActiveTab('comparison')} 
                onGoToTrust={() => setActiveTab('trust')} 
              />
            )}

            {/* TAB 6: RFx Drafting Co-Pilot (Slice 8) */}
            {activeTab === 'draft' && (
              <RFxDraftCopilot />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>Aerchain RFx Analyzer • Build Spec §9: Strict Slice Architecture</div>
          <div className="font-mono text-[11px]">Storage: Local JSON /data/cache/ • Inference: Groq</div>
        </div>
      </footer>
    </div>
  );
}
