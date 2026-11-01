import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Clock, 
  PhoneCall, 
  ShieldCheck, 
  MapPin, 
  Wrench, 
  Truck, 
  AlertCircle,
  XCircle 
} from 'lucide-react';
import { RescueProvider, RescueRequest, RequestStatus } from '../../types/rescue';
import { StorageService } from '../../services/storageService';

interface RequestRescueModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RescueRequest | null;
  onRequestUpdated: (req: RescueRequest) => void;
}

export const RequestRescueModal: React.FC<RequestRescueModalProps> = ({
  isOpen,
  onClose,
  request,
  onRequestUpdated
}) => {
  const [currentStatus, setCurrentStatus] = useState<RequestStatus>(request?.status || 'assigned');
  const [etaRemaining, setEtaRemaining] = useState<number>(request?.matchedProvider?.estimatedArrivalMinutes || 8);
  const [callDemoNotice, setCallDemoNotice] = useState(false);

  useEffect(() => {
    if (!request) return;
    setCurrentStatus(request.status);
    setEtaRemaining(request.matchedProvider?.estimatedArrivalMinutes || 8);
  }, [request]);

  if (!isOpen || !request || !request.matchedProvider) return null;

  const provider = request.matchedProvider;

  // Step advancement simulator
  const advanceStatus = (nextStatus: RequestStatus) => {
    setCurrentStatus(nextStatus);
    const updated = {
      ...request,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    };
    StorageService.updateRescueRequest(updated);
    onRequestUpdated(updated);
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this assistance request?')) {
      advanceStatus('cancelled');
    }
  };

  const steps: { id: RequestStatus; label: string; desc: string }[] = [
    { id: 'searching', label: 'Matching', desc: 'Analyzing WAV unit capability' },
    { id: 'assigned', label: 'Assigned', desc: 'Provider accepted request' },
    { id: 'in_transit', label: 'In Transit', desc: 'En route with wheelchair lift' },
    { id: 'arrived', label: 'Arrived', desc: 'On-site at breakdown point' },
    { id: 'completed', label: 'Completed', desc: 'Service successfully rendered' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 text-blue-100 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live Dispatch Tracking • Demo
            </span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-300" />
            Assistance Unit Dispatched
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Request #{request.id.slice(-6).toUpperCase()} • {provider.companyName}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Transparency alert */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Simulated Demonstration Dispatch:</strong> All provider credentials, driver names, mock phone numbers, vehicle license plates, ratings, and ETAs are <strong>DEMO DATA</strong> for Catalyst Hack 2026. No actual roadside service or real cellular calls are connected.
            </div>
          </div>

          {/* Stepper Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Progress</span>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                Status: {currentStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-2">
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.id} className="text-center">
                    <div className={`h-2 rounded-full mb-2 transition-all ${
                      isPassed ? 'bg-blue-600' : 'bg-slate-200'
                    } ${isCurrent ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`} />
                    <span className={`block text-[10px] font-bold ${
                      isCurrent ? 'text-blue-700' : isPassed ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Provider Profile */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                  {provider.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      {provider.name}
                      {provider.isVerifiedPartner && (
                        <span title="Verified Mobility Partner (Demo)">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </span>
                      )}
                    </h4>
                    <span className="text-[9.5px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded border border-amber-300 uppercase tracking-wider">
                      DEMO DATA
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Driver: <strong>{provider.driverName}</strong> <span className="text-[10px] text-amber-700 font-bold">(DEMO DATA)</span> • Plate: <strong>{provider.vehiclePlate}</strong> <span className="text-[10px] text-amber-700 font-bold">(DEMO DATA)</span>
                  </p>
                  <p className="text-xs text-amber-600 font-bold mt-0.5">
                    ⭐ {provider.rating} ({provider.reviewCount} reviews) • <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">DEMO DATA</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated ETA</span>
                <span className="text-xl font-black text-blue-700">~{etaRemaining} mins</span>
                <span className="text-[9.5px] font-bold text-amber-700 uppercase block">(DEMO DATA)</span>
              </div>
            </div>

            {/* Equipment highlight */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">WAV Hoist / Lift Equipment:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                provider.hasWheelchairHoistLift 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {provider.hasWheelchairHoistLift ? '✓ Onboard & Verified (DEMO DATA)' : 'Standard Towing'}
              </span>
            </div>

            {/* Safe Demo Interaction for Calling Driver */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCallDemoNotice(true);
                  setTimeout(() => setCallDemoNotice(false), 5000);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <PhoneCall className={`w-3.5 h-3.5 ${callDemoNotice ? 'animate-pulse text-amber-300' : ''}`} />
                <span>
                  {callDemoNotice 
                    ? 'Demo call — no real provider connected' 
                    : `Call Driver (${provider.phone} • DEMO DATA)`}
                </span>
              </button>

              {callDemoNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between animate-fade-in shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span><strong>Demo call — no real provider connected.</strong> (Mock number: {provider.phone} • DEMO DATA)</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setCallDemoNotice(false)} 
                    className="text-amber-800 hover:text-black font-bold px-1.5 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center font-medium">
                Phone Number: {provider.phone} <span className="font-bold text-amber-700">(DEMO DATA)</span> — No real cellular connection initiated
              </p>
            </div>
          </div>

          {/* Breakdown Location & Issue Summary */}
          <div className="text-xs space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Service Category:</span>
              <span className="font-bold text-slate-800 uppercase">{request.serviceType.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Breakdown Location:</span>
              <span className="font-bold text-slate-800 truncate max-w-[200px]">{request.locationName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Vehicle Type:</span>
              <span className="font-semibold text-slate-700">{request.vehicleType.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Simulation Controls for Judges */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Catalyst Judge Simulation Controls
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => advanceStatus('in_transit')}
                disabled={currentStatus === 'in_transit'}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition disabled:opacity-50"
              >
                Set "In Transit"
              </button>
              <button
                type="button"
                onClick={() => advanceStatus('arrived')}
                disabled={currentStatus === 'arrived'}
                className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition disabled:opacity-50"
              >
                Set "Arrived"
              </button>
              <button
                type="button"
                onClick={() => advanceStatus('completed')}
                disabled={currentStatus === 'completed'}
                className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition disabled:opacity-50"
              >
                Set "Completed"
              </button>
            </div>
          </div>

          {/* Cancel button */}
          {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
              >
                Cancel Assistance Request
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Close Tracker
          </button>
        </div>

      </div>
    </div>
  );
};
