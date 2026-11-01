import React from 'react';
import { X, Sparkles, Navigation, Wrench, CheckCircle, ArrowRight, ShieldCheck, Flag } from 'lucide-react';
import { ActiveTab } from '../layout/Navbar';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onTriggerDemoA: () => void;
  onTriggerDemoB: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onTriggerDemoA,
  onTriggerDemoB
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-800 to-emerald-700 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-brand-500/30 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
              Catalyst Hack 2026 Walkthrough
            </span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300" />
            Judges' Demonstration Hub
          </h2>
          <p className="text-xs text-brand-100 mt-1 leading-relaxed">
            Choose either end-to-end hackathon scenario below. You can trigger each flow with 1-click presets or try them step-by-step.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* DEMO A CARD */}
          <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Demo Scenario A: Accessible Navigation & Smart Rerouting</h3>
                  <span className="text-xs text-emerald-700 font-semibold">PSIT Kanpur ➔ Z Square Mall with Live Barrier Avoidance</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-800">
                Module 1
              </span>
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-5">
              <li>Configures <strong>PSIT Kanpur</strong> as Origin & <strong>Z Square Mall</strong> as Destination.</li>
              <li>Enforces <strong>Avoid Stairs</strong> and <strong>Step-Free Access</strong>.</li>
              <li>Runs Dijkstra algorithm to find 100% ramp-safe route and compares with standard corridor.</li>
              <li>Simulates active blocked ramp report on Mall Road to trigger <strong>real-time rerouting</strong> with AI explanation!</li>
            </ol>

            <button
              onClick={() => {
                onClose();
                onTriggerDemoA();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-brand-600/20"
            >
              <span>Launch Demo A Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* DEMO B CARD */}
          <div className="p-5 rounded-2xl border-2 border-blue-100 bg-blue-50/40 hover:bg-blue-50/80 transition space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Demo Scenario B: Roadside Rescue & WAV Hoist Matching</h3>
                  <span className="text-xs text-blue-700 font-semibold">PSIT Gate 1 Flat Tyre with Wheelchair Lift Dispatch</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-800">
                Module 2
              </span>
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-5">
              <li>Selects <strong>Flat Tyre / Puncture Repair</strong> at <strong>PSIT Kanpur Gate 1</strong>.</li>
              <li>Enables the critical <strong>Wheelchair Hoist / Lift Equipment</strong> requirement.</li>
              <li>Runs intelligent multi-criteria provider scoring and displays top verified helper.</li>
              <li>Dispatches a simulated assistance request with live telemetry status tracker!</li>
            </ol>

            <button
              onClick={() => {
                onClose();
                onTriggerDemoB();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
            >
              <span>Launch Demo B Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">All demo data clearly labelled for hackathon evaluation.</span>
          <button onClick={onClose} className="text-xs font-bold text-slate-700 hover:text-slate-950">
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};

