import React, { useState } from 'react';
import { 
  X, 
  PhoneCall, 
  MapPin, 
  Share2, 
  Check, 
  ShieldAlert, 
  Heart, 
  Copy, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';
import { StorageService, UserSOSProfile } from '../../services/storageService';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserSOSProfile>(StorageService.getSOSProfile());
  const [copied, setCopied] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('PSIT Kanpur Gate 1, Bhauti (26.4508° N, 80.1932° E)');
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleFetchCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus(`${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (Current Device GPS)`);
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation error or denied:', err);
          setLocationStatus('PSIT Kanpur Gate 1, Bhauti (26.4508° N, 80.1932° E)');
          setIsLocating(false);
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const emergencyMessage = [
    '🚨 EMERGENCY SOS — MOBILITY ASSISTANCE REQUIRED',
    `Name: ${profile.name || 'Traveler in Need'}`,
    profile.phone ? `Phone: ${profile.phone}` : null,
    `Location: ${locationStatus}`,
    profile.wheelchairModel ? `Wheelchair / Device: ${profile.wheelchairModel}` : null,
    (profile.bloodGroup || profile.medicalNotes) ? `Medical Profile: ${[profile.bloodGroup ? `Blood Group: ${profile.bloodGroup}` : '', profile.medicalNotes || ''].filter(Boolean).join(' | ')}` : null,
    profile.emergencyContactName ? `Primary Emergency Contact: ${profile.emergencyContactName} ${profile.emergencyContactRelationship ? `(${profile.emergencyContactRelationship})` : ''} ${profile.emergencyContactPhone ? `— ${profile.emergencyContactPhone}` : ''}` : null,
    'Google Maps Pin: https://maps.google.com/?q=26.4508,80.1932'
  ].filter(Boolean).join('\n');

  const copyEmergencyPacket = () => {
    navigator.clipboard.writeText(emergencyMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareViaWhatsApp = () => {
    const encoded = encodeURIComponent(emergencyMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-rose-100 overflow-hidden">
        
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-200">Emergency Support Portal</span>
              <h2 className="text-2xl font-black">Urgent Mobility SOS</h2>
            </div>
          </div>
          <p className="text-xs text-rose-100 leading-relaxed">
            Quickly trigger emergency contact dispatch and broadcast your exact accessible telemetry to helpers.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Transparency Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Demonstration Notice:</strong> Pressing SOS generates an emergency data packet and launches device telephone dialer links. It does <strong>not</strong> contact real-world emergency dispatch servers automatically without a municipal telematics integration. In a life-threatening crisis, dial <strong>112</strong> directly.
            </div>
          </div>

          {/* Quick Direct Emergency Phone Numbers */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              One-Touch Emergency Dialers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <a
                href="tel:112"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold transition group"
              >
                <PhoneCall className="w-5 h-5 mb-1 group-hover:scale-110 transition" />
                <span className="text-base font-black">112</span>
                <span className="text-[10px] uppercase font-semibold text-rose-500">National All-in-One</span>
              </a>

              <a
                href="tel:108"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold transition group"
              >
                <PhoneCall className="w-5 h-5 mb-1 group-hover:scale-110 transition" />
                <span className="text-base font-black">108</span>
                <span className="text-[10px] uppercase font-semibold text-emerald-600">Ambulance</span>
              </a>

              <a
                href="tel:100"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold transition group"
              >
                <PhoneCall className="w-5 h-5 mb-1 group-hover:scale-110 transition" />
                <span className="text-base font-black">100</span>
                <span className="text-[10px] uppercase font-semibold text-blue-600">Police</span>
              </a>

              <a
                href={`tel:${profile.emergencyContactPhone.replace(/[^0-9]/g, '')}`}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 font-bold transition group"
              >
                <Heart className="w-5 h-5 mb-1 text-purple-600 group-hover:scale-110 transition" />
                <span className="text-xs font-black truncate w-full text-center">Contact</span>
                <span className="text-[10px] uppercase font-semibold text-purple-500">Personal Kin</span>
              </a>
            </div>
          </div>

          {/* Current Location Verification */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                Broadcasted Location
              </span>
              <button
                onClick={handleFetchCurrentLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-brand-700 hover:underline"
              >
                {isLocating ? 'Locating...' : 'Refresh GPS'}
              </button>
            </div>
            <p className="text-xs font-medium text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200/60 font-mono">
              {locationStatus}
            </p>
          </div>

          {/* User Mobility & Medical Profile Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Registered Mobility &amp; Emergency Telemetry
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">User Name</span>
                <span className="font-bold text-slate-800">{profile.name || 'Anonymous Traveler'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Blood Group</span>
                <span className="font-bold text-rose-600">{profile.bloodGroup || 'Not specified'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase">Wheelchair Model / Device</span>
                <span className="font-semibold text-slate-800">{profile.wheelchairModel || 'None specified'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase">Medical Alert / Assistance Notes</span>
                <span className="font-medium text-slate-700">{profile.medicalNotes || 'No medical notes provided'}</span>
              </div>
              <div className="col-span-2 border-t border-slate-200/80 pt-2">
                <span className="text-slate-400 block text-[10px] uppercase">Emergency Contact</span>
                <span className="font-bold text-slate-800">
                  {profile.emergencyContactName 
                    ? `${profile.emergencyContactName} ${profile.emergencyContactRelationship ? `(${profile.emergencyContactRelationship})` : ''} — ${profile.emergencyContactPhone || 'No phone'}`
                    : 'No emergency contact registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Sharing Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={copyEmergencyPacket}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Emergency Packet Copied!' : 'Copy Telemetry Packet'}
            </button>

            <button
              onClick={shareViaWhatsApp}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
            >
              <Share2 className="w-4 h-4" />
              Dispatch via WhatsApp
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">AccessResQ 24/7 Rapid Protocol</span>
          <button onClick={onClose} className="text-xs font-bold text-slate-600 hover:text-slate-900">
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};

