import React from 'react';
import { 
  Navigation, 
  Wrench, 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Truck, 
  Sparkles, 
  ChevronRight, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { ActiveTab } from '../layout/Navbar';
import { BarrierReport } from '../../types/community';
import { RescueProvider } from '../../types/rescue';
import { INITIAL_RESCUE_PROVIDERS } from '../../data/rescueProviders';
import { INITIAL_SEGMENTS } from '../../data/routeNetwork';
import { LeafletMap } from '../common/LeafletMap';
import { POPULAR_LOCATIONS } from '../../data/locations';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  barriers: BarrierReport[];
  onOpenReportBarrier: () => void;
  onOpenSOS: () => void;
  onTriggerDemoA: () => void;
  onTriggerDemoB: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  barriers,
  onOpenReportBarrier,
  onOpenSOS,
  onTriggerDemoA,
  onTriggerDemoB
}) => {
  // Real metric calculations from available application data
  const accessibleSegmentsCount = INITIAL_SEGMENTS.filter(s => s.isVerifiedAccessible).length;
  const activeBarriersCount = barriers.filter(b => b.status !== 'resolved').length;
  const providersCount = INITIAL_RESCUE_PROVIDERS.length;
  const averageEta = Math.round(
    INITIAL_RESCUE_PROVIDERS.reduce((acc, p) => acc + p.estimatedArrivalMinutes, 0) / providersCount
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-brand-900 text-white p-7 md:p-10 shadow-elevated border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Catalyst Hack 2026 Innovation Showcase
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Don't just find the shortest route.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
              Find the route that works for the person.
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
            AccessResQ bridges mobility navigation, community-driven barrier intelligence, and accessible roadside rescue with verified wheelchair lift capabilities.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('navigation')}
              className="py-3 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-brand-500/25 flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Start Accessible Route
            </button>

            <button
              onClick={() => setActiveTab('rescue')}
              className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition border border-white/20 flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-emerald-400" />
              Roadside Assistance
            </button>

            <button
              onClick={onOpenSOS}
              className="py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/30 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Instant SOS
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-96 h-96 text-white" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="4.5" r="2.5"/>
            <path d="m10 9 4 2.5-2.5 4.5"/>
            <path d="M6 14.5a5.5 5.5 0 1 0 11 0"/>
            <path d="M12 9.5v5"/>
          </svg>
        </div>
      </div>

      {/* KPI Stat Cards (4 Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Accessible Corridors */}
        <div 
          onClick={() => setActiveTab('navigation')}
          className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 hover:border-brand-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Graph Simulated
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">{accessibleSegmentsCount} Corridors</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">Mapped Step-Free Graph Legs</span>
        </div>

        {/* Card 2: Active Barriers */}
        <div 
          onClick={() => setActiveTab('community')}
          className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Community Audits
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">{activeBarriersCount} Active Obstacles</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">Crowdsourced Barrier Reports</span>
        </div>

        {/* Card 3: Rescue Units Standby */}
        <div 
          onClick={() => setActiveTab('rescue')}
          className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Sample Fleet
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">{providersCount} Rescue Units</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">WAV Lift Equipped Units</span>
        </div>

        {/* Card 4: Average Rescue ETA */}
        <div 
          onClick={() => setActiveTab('rescue')}
          className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 hover:border-purple-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Simulated Average
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">~{averageEta} mins ETA</span>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">Proximity Model Estimate</span>
        </div>

      </div>

      {/* Catalyst Hack Demo Journeys Card (One-click execution for judges) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-6 rounded-3xl border border-emerald-200/70 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-ping"></span>
            <h3 className="text-base font-extrabold text-slate-900">
              Interactive Hackathon Demo Scenarios (Catalyst '26)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">1-Click Test Flows</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wide">Demo A</span>
                <span className="text-[11px] font-semibold text-slate-500">Navigation & Rerouting</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mt-1">PSIT Kanpur ➔ Z Square Mall</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Evaluates 100% step-free routing, avoids 22 steps, and tests dynamic barrier avoidance.
              </p>
            </div>
            <button
              onClick={onTriggerDemoA}
              className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>Execute Demo A</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Demo B</span>
                <span className="text-[11px] font-semibold text-slate-500">Roadside Rescue Dispatch</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mt-1">PSIT Gate 1 Flat Tyre + WAV Lift</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Matches closest assistance unit equipped with hydraulic wheelchair lift with live tracking.
              </p>
            </div>
            <button
              onClick={onTriggerDemoB}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>Execute Demo B</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Split: Spatial Live Map + Recent Community Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Overview Spatial Map (7 cols) */}
        <div className="lg:col-span-7 bg-white p-4 rounded-3xl shadow-card border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-600" />
              Live City Accessibility & Rescue Fleet Overview
            </span>
            <button 
              onClick={() => setActiveTab('navigation')}
              className="text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-1"
            >
              Open Full Navigator
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <LeafletMap
            barriers={barriers}
            providers={INITIAL_RESCUE_PROVIDERS}
            className="h-[360px] w-full rounded-2xl"
          />

          <div className="px-2 pt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Showing verified route anchors, reported obstacles, and active rescue patrol units</span>
            <button
              onClick={onOpenReportBarrier}
              className="font-bold text-amber-700 hover:text-amber-800 hover:underline"
            >
              + Quick Report Barrier
            </button>
          </div>
        </div>

        {/* Right Column: Recent Community Reports (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" />
              Recent Accessibility Reports
            </span>
            <button
              onClick={() => setActiveTab('community')}
              className="text-[11px] font-bold text-brand-700 hover:underline"
            >
              View All ({barriers.length})
            </button>
          </div>

          <div className="space-y-3">
            {barriers.slice(0, 4).map(report => (
              <div
                key={report.id}
                onClick={() => setActiveTab('community')}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition cursor-pointer bg-slate-50/60 hover:bg-slate-50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {report.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    +{report.confirmationsCount} confirmations
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{report.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{report.description}</p>
                <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 pt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{report.locationName}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenReportBarrier}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Report an Obstacle Now
          </button>
        </div>

      </div>

    </div>
  );
};

