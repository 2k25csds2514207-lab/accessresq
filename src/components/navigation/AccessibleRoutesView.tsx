import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  ArrowRightLeft, 
  MapPin, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  Clock, 
  Footprints, 
  ChevronRight, 
  RotateCcw,
  Volume2,
  Info
} from 'lucide-react';
import { 
  LocationItem, 
  RouteCalculationResult, 
  RouteOption, 
  RoutePreferences 
} from '../../types/navigation';
import { POPULAR_LOCATIONS, DEFAULT_ORIGIN, DEFAULT_DESTINATION } from '../../data/locations';
import { RoutingEngine, routingEngineInstance } from '../../services/routingEngine';
import { aiEngineInstance } from '../../services/aiEngine';
import { LeafletMap } from '../common/LeafletMap';
import { BarrierReport } from '../../types/community';

interface AccessibleRoutesViewProps {
  preferences: RoutePreferences;
  onUpdatePreferences: (prefs: RoutePreferences) => void;
  barriers: BarrierReport[];
  onOpenReportBarrier: (preset?: { name: string; coordinate: { lat: number; lng: number }; affectedSegmentId?: string }) => void;
  demoTrigger?: boolean;
}

export const AccessibleRoutesView: React.FC<AccessibleRoutesViewProps> = ({
  preferences,
  onUpdatePreferences,
  barriers,
  onOpenReportBarrier,
  demoTrigger
}) => {
  const [origin, setOrigin] = useState<LocationItem>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState<LocationItem>(DEFAULT_DESTINATION);
  const [routeResult, setRouteResult] = useState<RouteCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTabRoute, setActiveTabRoute] = useState<'recommended' | 'alternative'>('recommended');
  const [isRerouted, setIsRerouted] = useState(false);
  const [rerouteReason, setRerouteReason] = useState<string>('');
  const [blockedCoordinates, setBlockedCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [showPreferencesPanel, setShowPreferencesPanel] = useState(true);

  // Auto-calculate on initial load, preference changes, or demo trigger
  useEffect(() => {
    handleCalculateRoute();
  }, [
    origin.id, 
    destination.id, 
    preferences.avoidStairs, 
    preferences.stepFreeAccess, 
    preferences.preferRamps, 
    preferences.smoothSurfaces, 
    preferences.wellLitRoutes, 
    preferences.lowerVibration, 
    preferences.wheelchairType, 
    demoTrigger
  ]);

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc: LocationItem = {
            id: 'current_user_pos',
            name: 'Current Device Location (GPS)',
            shortName: 'My Location',
            category: 'other',
            address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            coordinate: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            accessibleFeatures: ['Real-time Geolocation']
          };
          setOrigin(userLoc);
        },
        () => {
          alert('GPS permission not granted or unavailable. Defaulted to PSIT Kanpur.');
        }
      );
    }
  };

  const handleCalculateRoute = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const result = routingEngineInstance.calculateRoute(origin, destination, preferences);
      setRouteResult(result);
      setIsCalculating(false);
    }, 300);
  };

  // Smart Rerouting Demo Action (Catalyst Demo A requirement)
  const triggerBlockedRampReroute = () => {
    setIsCalculating(true);
    // Block active MG Road accessible promenade segment leading to destination
    const targetSegmentId = 'seg_mg_road_accessible_walk';
    routingEngineInstance.blockSegment(
      targetSegmentId, 
      'Delivery vehicles parked on curb-cut ramp at MG Road Promenade'
    );
    const blockedSeg = routingEngineInstance.getSegment(targetSegmentId);
    if (blockedSeg) {
      setBlockedCoordinates(blockedSeg.coordinates);
    }
    
    setTimeout(() => {
      const updated = routingEngineInstance.calculateRoute(origin, destination, preferences);
      setRouteResult(updated);
      setIsRerouted(true);
      setRerouteReason('Blocked curb ramp detected on MG Road Plaza Promenade. AccessResQ automatically bypassed obstacle via Phool Bagh VIP South Ramped Promenade (+400m, 100% Step-Free).');
      setIsCalculating(false);
    }, 450);
  };

  const handleRestoreRoute = () => {
    routingEngineInstance.unblockSegment('seg_mg_road_accessible_walk');
    setBlockedCoordinates([]);
    setIsRerouted(false);
    setRerouteReason('');
    handleCalculateRoute();
  };

  const selectedRoute: RouteOption | undefined = 
    activeTabRoute === 'recommended' 
      ? routeResult?.recommendedRoute 
      : (routeResult?.alternativeRoute || routeResult?.recommendedRoute);

  const aiExplanation = routeResult && selectedRoute 
    ? aiEngineInstance.explainRouteSelection(selectedRoute, routeResult.alternativeRoute, preferences)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
              <Navigation className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Intelligent Accessible Route Navigation
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Graph-based Dijkstra & A* routing prioritizing step-free corridors, curb ramps, and low vibration surfaces.
          </p>
        </div>

        {/* Quick catalyst demo shortcut badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setOrigin(DEFAULT_ORIGIN);
              setDestination(DEFAULT_DESTINATION);
              onUpdatePreferences({ ...preferences, avoidStairs: true, stepFreeAccess: true });
              handleCalculateRoute();
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 transition shadow-sm"
          >
            Load Demo A: PSIT ➔ Z Square Mall
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel + Live Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Route Inputs & Preferences (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Origin & Destination Card */}
          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 space-y-4">
            
            {/* Origin */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
                  Starting Point (Origin)
                </label>
                <button
                  onClick={handleUseCurrentLocation}
                  className="text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  Use Current GPS
                </button>
              </div>
              <select
                value={origin.id}
                onChange={(e) => {
                  const loc = POPULAR_LOCATIONS.find(l => l.id === e.target.value);
                  if (loc) setOrigin(loc);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {POPULAR_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                onClick={handleSwapLocations}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 shadow-sm"
                title="Swap Starting Point and Destination"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Destination
              </label>
              <select
                value={destination.id}
                onChange={(e) => {
                  const loc = POPULAR_LOCATIONS.find(l => l.id === e.target.value);
                  if (loc) setDestination(loc);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {POPULAR_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculateRoute}
              disabled={isCalculating}
              className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-brand-600/25 flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              {isCalculating ? 'Computing Optimal Route...' : 'Calculate Accessible Route'}
            </button>
          </div>

          {/* Accessibility Preferences Panel */}
          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-600" />
                Accessibility Preferences
              </span>
              <button
                onClick={() => setShowPreferencesPanel(!showPreferencesPanel)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                {showPreferencesPanel ? 'Hide' : 'Expand'}
              </button>
            </div>

            {showPreferencesPanel && (
              <div className="space-y-3 pt-1 text-xs">
                {/* Avoid Stairs */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <span className="font-semibold text-slate-800">Avoid Stairs / Steps</span>
                  <input
                    type="checkbox"
                    checked={preferences.avoidStairs}
                    onChange={(e) => onUpdatePreferences({ ...preferences, avoidStairs: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </label>

                {/* Step Free Access */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <div>
                    <span className="font-semibold text-slate-800 block">Strict Step-Free Access</span>
                    <span className="text-[10px] text-slate-500">Zero tolerance for steps or high ledges</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.stepFreeAccess}
                    onChange={(e) => onUpdatePreferences({ ...preferences, stepFreeAccess: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </label>

                {/* Prefer Ramps */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <span className="font-semibold text-slate-800">Prioritize Gentle Incline Ramps (1:12)</span>
                  <input
                    type="checkbox"
                    checked={preferences.preferRamps}
                    onChange={(e) => onUpdatePreferences({ ...preferences, preferRamps: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </label>

                {/* Smooth Surfaces */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <div>
                    <span className="font-semibold text-slate-800 block">Smooth Surfaces Only</span>
                    <span className="text-[10px] text-slate-500">Avoid broken pavement, gravel & cobblestone</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.smoothSurfaces}
                    onChange={(e) => onUpdatePreferences({ ...preferences, smoothSurfaces: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </label>

                {/* Well-Lit Routes */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <span className="font-semibold text-slate-800">Well-Lit Night Corridors</span>
                  <input
                    type="checkbox"
                    checked={preferences.wellLitRoutes}
                    onChange={(e) => onUpdatePreferences({ ...preferences, wellLitRoutes: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </label>

                {/* Lower Vibration */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
                  <div>
                    <span className="font-semibold text-slate-800 block">Low Vibration Mode</span>
                    <span className="text-[10px] text-slate-500">Critical for spinal cord & pain sensitivity</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.lowerVibration}
                    onChange={(e) => onUpdatePreferences({ ...preferences, lowerVibration: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </label>

                {/* Wheelchair Profile selector */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">Mobility Device Profile</span>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    {(['manual', 'electric', 'scooter'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onUpdatePreferences({ ...preferences, wheelchairType: type })}
                        className={`py-1.5 px-2 rounded-lg font-bold capitalize border transition ${
                          preferences.wheelchairType === type
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rerouting Test Trigger (Judge Action) */}
          <div className="bg-amber-50/70 p-4 rounded-3xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Catalyst Demo: Smart Rerouting Simulation
              </span>
            </div>
            <p className="text-[11.5px] text-amber-800 leading-relaxed">
              Test dynamic avoidance. Simulate reporting a sudden obstruction (e.g. bikes parked on the Civil Lines curb ramp). AccessResQ re-evaluates the network in real-time.
            </p>
            {!isRerouted ? (
              <button
                onClick={triggerBlockedRampReroute}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Simulate Blocked Ramp & Trigger Reroute
              </button>
            ) : (
              <button
                onClick={handleRestoreRoute}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Barrier & Restore Direct Route
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Live Interactive Map & Route Summary Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Reroute Alert Banner if triggered */}
          {isRerouted && (
            <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-md animate-fade-in flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-extrabold uppercase tracking-wide">Smart Rerouting Activated!</h4>
                <p className="leading-relaxed">{rerouteReason}</p>
              </div>
            </div>
          )}

          {/* Leaflet Interactive Map */}
          <div className="bg-white p-3 rounded-3xl shadow-card border border-slate-200/80">
            <div className="flex items-center justify-between px-2 pb-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-brand-600" />
                Live Spatial Navigation Map
              </span>
              <span className="text-[11px] text-slate-400">
                Leaflet + OpenStreetMap • Real-time Graph Visualizer
              </span>
            </div>
            
            <LeafletMap
              origin={origin.coordinate}
              originLabel={origin.shortName}
              destination={destination.coordinate}
              destinationLabel={destination.shortName}
              routeCoordinates={routeResult?.recommendedRoute.coordinates || []}
              alternativeCoordinates={
                activeTabRoute === 'alternative' 
                  ? routeResult?.alternativeRoute?.coordinates 
                  : undefined
              }
              blockedCoordinates={blockedCoordinates}
              barriers={barriers}
              className="h-[400px] w-full rounded-2xl"
            />
          </div>

          {/* Route Comparison & Metrics Card */}
          {routeResult && selectedRoute && (
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200/80 space-y-5">
              
              {/* Route Option Tabs: Recommended vs Alternative */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setActiveTabRoute('recommended')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTabRoute === 'recommended'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Recommended Step-Free Route
                </button>

                {routeResult.alternativeRoute && (
                  <button
                    onClick={() => setActiveTabRoute('alternative')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      activeTabRoute === 'alternative'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Standard Direct Corridor</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                      {routeResult.alternativeRoute.stepsCount} Steps
                    </span>
                  </button>
                )}
              </div>

              {/* High-Level Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Distance</span>
                  <span className="text-lg font-black text-slate-900">
                    {(selectedRoute.totalDistanceMeters / 1000).toFixed(2)} km
                  </span>
                  <span className="text-[10px] text-slate-500 block">({selectedRoute.totalDistanceMeters}m)</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Duration</span>
                  <span className="text-lg font-black text-slate-900">
                    ~{selectedRoute.estimatedDurationMinutes} mins
                  </span>
                  <span className="text-[10px] text-brand-600 font-semibold block">{preferences.wheelchairType} pace</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Steps Count</span>
                  <span className="text-lg font-black text-emerald-800">
                    {selectedRoute.stepsCount === 0 ? '0 (Step-Free)' : `${selectedRoute.stepsCount} steps`}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">{selectedRoute.rampsCount} compliant ramps</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mobility Score</span>
                  <span className="text-lg font-black text-brand-700">
                    {selectedRoute.accessibilityScore}/100
                  </span>
                  <span className="text-[10px] text-slate-500 block">{selectedRoute.smoothSurfacePercentage}% smooth surface</span>
                </div>
              </div>

              {/* AI Explainability Box: "Why this route was chosen" */}
              {aiExplanation && (
                <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-brand-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      AI Route Intelligence Rationale
                    </span>
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-200/60 px-2 py-0.5 rounded-md">
                      Dijkstra Cost Optimization
                    </span>
                  </div>
                  <p className="text-brand-900 font-semibold">{aiExplanation.summary}</p>
                  <ul className="text-brand-800 space-y-1 list-disc pl-4 text-[11.5px]">
                    {aiExplanation.accessibilityHighlights.map((hl, i) => (
                      <li key={i}>{hl}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-brand-700 font-medium pt-1 border-t border-brand-200/60">
                    Tradeoff Analysis: {aiExplanation.tradeoffs}
                  </p>
                </div>
              )}

              {/* Turn-by-Turn Accessible Navigation List */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Accessible Turn-by-Turn Guidance ({selectedRoute.turnByTurn.length} Legs)
                </span>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {selectedRoute.turnByTurn.map((t, index) => (
                    <div key={index} className="py-2.5 flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{t.instruction}</p>
                        {t.note && (
                          <span className="inline-block mt-0.5 text-[10.5px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                            {t.note}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.distanceMeters}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Barrier Shortcut for this corridor */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Notice a new obstruction on this corridor?</span>
                <button
                  onClick={() => onOpenReportBarrier({
                    name: `${origin.shortName} to ${destination.shortName} corridor`,
                    coordinate: origin.coordinate
                  })}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Report Barrier on Route
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

