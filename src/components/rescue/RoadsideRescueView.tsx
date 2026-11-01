import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  BatteryCharging, 
  Truck, 
  Disc, 
  Accessibility, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  PhoneCall, 
  Sparkles, 
  CheckCircle, 
  Filter,
  User,
  Phone,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { 
  RescueProvider, 
  RescueRequest, 
  RescueServiceType, 
  VehicleType 
} from '../../types/rescue';
import { matchingEngineInstance, ProviderMatchScore, getServiceLabel } from '../../services/matchingEngine';
import { aiEngineInstance } from '../../services/aiEngine';
import { StorageService } from '../../services/storageService';
import { LeafletMap } from '../common/LeafletMap';
import { RequestRescueModal } from './RequestRescueModal';

interface RoadsideRescueViewProps {
  demoTrigger?: boolean;
}

export const RoadsideRescueView: React.FC<RoadsideRescueViewProps> = ({ demoTrigger }) => {
  const [selectedService, setSelectedService] = useState<RescueServiceType>('flat_tyre');
  const [breakdownLocation, setBreakdownLocation] = useState('PSIT Kanpur — Gate 1, Bhauti');
  const [userCoordinate, setUserCoordinate] = useState({ lat: 26.4508, lng: 80.1932 });
  const [vehicleType, setVehicleType] = useState<VehicleType>('power_wheelchair');
  const [hoistRequired, setHoistRequired] = useState(true);
  const [userName, setUserName] = useState('Devendra Sharma');
  const [userPhone, setUserPhone] = useState('+91 98765 43210');
  const [notes, setNotes] = useState('Left drive tyre punctured on service road incline. Need wheelchair lift for safe transfer.');

  const [selectedProvider, setSelectedProvider] = useState<RescueProvider | null>(null);
  const [activeTrackingRequest, setActiveTrackingRequest] = useState<RescueRequest | null>(() => {
    const list = StorageService.getRescueRequests();
    return list.length > 0 ? list[0] : null;
  });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  useEffect(() => {
    if (demoTrigger) {
      handleLoadDemoB();
    }
  }, [demoTrigger]);

  // Compute matching providers using matching engine
  const scoredProviders: ProviderMatchScore[] = matchingEngineInstance.matchProviders(
    {
      serviceType: selectedService,
      hasWheelchairHoistRequired: hoistRequired,
      coordinate: userCoordinate
    },
    hoistRequired
  );

  const topMatch = scoredProviders[0];

  const handleSelectProvider = (prov: RescueProvider) => {
    setSelectedProvider(prov);
  };

  const handleDispatch = (providerToDispatch: RescueProvider) => {
    const newRequest: RescueRequest = {
      id: `req_${Date.now()}`,
      serviceType: selectedService,
      vehicleType,
      locationName: breakdownLocation,
      coordinate: userCoordinate,
      hasWheelchairHoistRequired: hoistRequired,
      userName,
      userPhone,
      urgency: 'critical',
      notes,
      status: 'assigned',
      matchedProvider: providerToDispatch,
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    StorageService.addRescueRequest(newRequest);
    setActiveTrackingRequest(newRequest);
    setIsTrackingModalOpen(true);
  };

  const handleLoadDemoB = () => {
    setSelectedService('flat_tyre');
    setBreakdownLocation('PSIT Kanpur — Gate 1, Bhauti');
    setUserCoordinate({ lat: 26.4508, lng: 80.1932 });
    setHoistRequired(true);
    setVehicleType('power_wheelchair');
    setNotes('Left tyre puncture on wheelchair. Need ramp/hoist equipped rescue unit.');
  };

  const serviceCategories: { id: RescueServiceType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'flat_tyre', label: 'Flat Tyre / Puncture', icon: Disc },
    { id: 'battery_jump', label: 'Battery Jump-Start', icon: BatteryCharging },
    { id: 'wav_assistance', label: 'WAV & Hoist Support', icon: Accessibility },
    { id: 'towing', label: 'Flatbed Towing', icon: Truck },
    { id: 'basic_repair', label: 'Basic Repair', icon: Wrench },
  ];

  const vehicleOptions: { id: VehicleType; label: string }[] = [
    { id: 'power_wheelchair', label: 'Electric / Power Wheelchair' },
    { id: 'manual_wheelchair', label: 'Manual Wheelchair' },
    { id: 'mobility_scooter', label: '3/4 Wheel Mobility Scooter' },
    { id: 'accessible_van', label: 'Wheelchair Accessible Van (WAV)' },
    { id: 'standard_car', label: 'Standard Passenger Car' },
  ];

  const aiRationale = topMatch 
    ? aiEngineInstance.explainHelperRecommendation(topMatch.provider, selectedService, hoistRequired)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Roadside Assistance & Mobility Rescue
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Intelligent helper dispatch matching vehicle compatibility, proximity, and wheelchair hoist/lift capabilities.
          </p>
        </div>

        {/* Demo B Quick Trigger Button */}
        <button
          onClick={handleLoadDemoB}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition shadow-sm"
        >
          Load Demo B: PSIT Gate 1 Flat Tyre + WAV Lift
        </button>
      </div>

      {/* Active Request Tracker Banner (persists after closing modal or refreshing) */}
      {activeTrackingRequest && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-900">
                  Simulated Request #{activeTrackingRequest.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                  {activeTrackingRequest.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-blue-700 font-medium">
                {activeTrackingRequest.serviceType.replace('_', ' ')} at {activeTrackingRequest.locationName} • Unit: {activeTrackingRequest.matchedProvider?.name} (ETA ~{activeTrackingRequest.matchedProvider?.estimatedArrivalMinutes}m)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTrackingModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Status Tracker</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Request Form + Provider Matching Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Request Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 space-y-4">
            
            {/* Assistance Category Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Type of Breakdown / Assistance Required
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {serviceCategories.map(({ id, label, icon: Icon }) => {
                  const isSelected = selectedService === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedService(id)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 border transition ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Breakdown Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Current Breakdown Location
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setBreakdownLocation('PSIT Kanpur — Gate 1, Bhauti');
                    setUserCoordinate({ lat: 26.4508, lng: 80.1932 });
                  }}
                  className="text-[11px] font-bold text-blue-700 hover:underline"
                >
                  Set PSIT Gate 1
                </button>
              </div>
              <input
                type="text"
                value={breakdownLocation}
                onChange={(e) => setBreakdownLocation(e.target.value)}
                placeholder="e.g. NH-19 Service Lane, PSIT Kanpur Gate 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Vehicle or Mobility Device
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vehicleOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Wheelchair Hoist / Lift Requirement Toggle (CRITICAL INNOVATION) */}
            <div className="p-3.5 rounded-2xl bg-brand-50/80 border-2 border-brand-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hoistRequired}
                  onChange={(e) => setHoistRequired(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-brand-600 rounded focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-extrabold text-brand-900 block">
                    Wheelchair Hoist / WAV Hydraulic Lift Required
                  </span>
                  <p className="text-[11px] text-brand-700 leading-relaxed mt-0.5">
                    Filter and prioritize rescue trucks equipped with verified hydraulic tail-lifts and ramps for wheelchair passenger transfer.
                  </p>
                </div>
              </label>
            </div>

            {/* User contact info */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Contact Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Additional Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific breakdown details..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none leading-relaxed"
              />
            </div>

          </div>

          {/* Quick Notice Card */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Verified Partner Network:</strong> All units in our Kanpur network are certified for accessible handling and carry heavy battery boosters, tire plugs, and wheelchair restraint straps.
            </p>
          </div>

        </div>

        {/* Right Column: Matched Providers & Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* AI Helper Recommendation Callout */}
          {aiRationale && topMatch && (
            <div className="p-4 rounded-3xl bg-blue-50/90 border border-blue-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Matching Recommendation Rationale
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-200/60 px-2 py-0.5 rounded-md">
                  Compatibility Score: {topMatch.totalScore}%
                </span>
              </div>
              <p className="text-blue-900 font-bold">{aiRationale.summary}</p>
              <ul className="text-blue-800 space-y-1 list-disc pl-4 text-[11.5px]">
                {aiRationale.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className="pt-1 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-blue-700">
                <span>Equipment Compatibility: <strong>{aiRationale.equipmentFit}</strong></span>
              </div>
            </div>
          )}

          {/* Map showing user breakdown location & nearby rescue units */}
          <div className="bg-white p-3 rounded-3xl shadow-card border border-slate-200/80">
            <div className="flex items-center justify-between px-2 pb-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                Active Roadside Units in Proximity ({scoredProviders.length} Available)
              </span>
              <span className="text-[11px] text-slate-400">
                Kanpur Metro Radius
              </span>
            </div>

            <LeafletMap
              center={userCoordinate}
              zoom={13}
              origin={userCoordinate}
              originLabel="Your Breakdown Location"
              providers={scoredProviders.map(sp => sp.provider)}
              selectedProviderId={selectedProvider?.id}
              className="h-[260px] w-full rounded-2xl"
            />
          </div>

          {/* Scored Providers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ranked Mobility-Compatible Responders ({scoredProviders.length})
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Sorted by capability & ETA</span>
            </div>

            <div className="space-y-3">
              {scoredProviders.map(({ provider, totalScore, etaMinutes, distanceKm, matchReasons }) => {
                const isSelected = selectedProvider?.id === provider.id;

                return (
                  <div
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider)}
                    className={`p-4 rounded-3xl border-2 transition cursor-pointer bg-white ${
                      isSelected
                        ? 'border-blue-600 shadow-md ring-2 ring-blue-100'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shadow-sm">
                          {provider.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900">{provider.name}</h4>
                            {provider.isVerifiedPartner && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{provider.companyName} • Plate {provider.vehiclePlate}</p>
                          <div className="flex items-center gap-3 text-xs mt-1">
                            <span className="text-amber-600 font-bold">⭐ {provider.rating} ({provider.reviewCount})</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-semibold">{distanceKm} km away</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-blue-700 font-bold">ETA ~{etaMinutes}m</span>
                          </div>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Match Score</span>
                        <span className="text-lg font-black text-brand-700">{totalScore}%</span>
                      </div>
                    </div>

                    {/* Equipment badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                      {provider.hasWheelchairHoistLift && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ Hydraulic Wheelchair Lift
                        </span>
                      )}
                      {provider.hasRampEquipment && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          ✓ Heavy-Duty Ramp Plates
                        </span>
                      )}
                      {provider.isMobilityCertified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                          ✓ Certified Accessible Responder
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3.5 flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-500 truncate max-w-[280px]">
                        {provider.bio}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDispatch(provider);
                        }}
                        className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Dispatch This Unit
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Live Tracking Modal */}
      <RequestRescueModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        request={activeTrackingRequest}
        onRequestUpdated={(updated) => setActiveTrackingRequest(updated)}
      />

    </div>
  );
};
