import React from 'react';
import { ShieldCheck, Heart, Sparkles, Navigation, Wrench, Users, Github } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSOS: () => void;
  onOpenDemoScenarios: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  setActiveTab,
  onOpenSOS,
  onOpenDemoScenarios
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="4.5" r="2.5"/>
                  <path d="m10 9 4 2.5-2.5 4.5"/>
                  <path d="M6 14.5a5.5 5.5 0 1 0 11 0"/>
                  <path d="M12 9.5v5"/>
                </svg>
              </div>
              <span className="text-xl font-extrabold text-white">
                Access<span className="text-brand-400">ResQ</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              "Don't just find the shortest route. Find the route that works for the person."
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Catalyst Hack 2026 Production Build
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Core Modules</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setActiveTab('navigation')} className="hover:text-brand-400 transition flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5" /> Accessible Routes & Rerouting
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('rescue')} className="hover:text-brand-400 transition flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5" /> Roadside Rescue & WAV Hoist
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('community')} className="hover:text-brand-400 transition flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Community Barrier Reporting
                </button>
              </li>
              <li>
                <button onClick={onOpenSOS} className="hover:text-rose-400 text-rose-300 transition flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Emergency SOS Dispatch Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Technical Architecture */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Tech Specs</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p><strong className="text-slate-200">Routing Algorithm:</strong> Preference-Weighted Dijkstra & A*</p>
              <p><strong className="text-slate-200">Map Rendering:</strong> Leaflet + OpenStreetMap</p>
              <p><strong className="text-slate-200">Helper Matching:</strong> Proximity & WAV Equipment Weighting</p>
              <p><strong className="text-slate-200">AI Intelligence:</strong> Heuristic NLP Engine + Gemini API Bridge</p>
              <p><strong className="text-slate-200">Persistence:</strong> LocalStorage Demo Mode + PostgreSQL Schema</p>
            </div>
          </div>

          {/* Demonstration Notice */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Judge Walkthrough</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Explore Demo A (PSIT to Z Square step-free navigation with live barrier rerouting) and Demo B (PSIT Gate 1 WAV roadside rescue dispatch).
            </p>
            <button
              onClick={onOpenDemoScenarios}
              className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open Judge Interactive Guide
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 AccessResQ — Catalyst Hack 2026. Built with focus on digital inclusion and accessible mobility.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Demo Mode Active</span>
            <span>•</span>
            <span className="text-slate-400">Strict Data Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

