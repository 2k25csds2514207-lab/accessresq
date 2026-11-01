import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  Check, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck,
  Cloud,
  Loader2,
  Trash2,
  Cpu
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { 
  getActiveSupabaseCredentials, 
  isSupabaseConfigured, 
  saveSupabaseCredentials, 
  testSupabaseConnection 
} from '../../services/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataReset
}) => {
  const [resetSuccess, setResetSuccess] = useState(false);

  // Clear any legacy client-side Gemini keys from localStorage
  useEffect(() => {
    localStorage.removeItem('accessresq_gemini_key');
  }, []);

  // Supabase Credentials State
  const initialCreds = getActiveSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.key || '');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseSaveNotice, setSupabaseSaveNotice] = useState<string | null>(null);
  const [connectionResult, setConnectionResult] = useState<{
    connected: boolean;
    message: string;
    rowCount?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleSaveSupabase = () => {
    saveSupabaseCredentials(supabaseUrl.trim() || null, supabaseAnonKey.trim() || null);
    setSupabaseSaveNotice('Supabase credentials saved successfully!');
    setConnectionResult(null);
    setTimeout(() => setSupabaseSaveNotice(null), 3500);
  };

  const handleClearSupabase = () => {
    if (window.confirm('Disconnect Supabase and switch back to pure local storage demo mode?')) {
      saveSupabaseCredentials(null, null);
      setSupabaseUrl('');
      setSupabaseAnonKey('');
      setConnectionResult(null);
      setSupabaseSaveNotice('Disconnected. Local storage fallback is now active.');
      setTimeout(() => setSupabaseSaveNotice(null), 3500);
    }
  };

  const handleTestSupabase = async () => {
    // First save current inputs to ensure client uses them
    saveSupabaseCredentials(supabaseUrl.trim() || null, supabaseAnonKey.trim() || null);
    setIsTestingSupabase(true);
    setConnectionResult(null);

    try {
      const res = await testSupabaseConnection();
      setConnectionResult(res);
    } catch (err: any) {
      setConnectionResult({
        connected: false,
        message: err.message || 'Unknown network error'
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all community barrier reports, rescue requests, and reroutes back to initial demo state?')) {
      StorageService.resetToDemoDefaults();
      onDataReset();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Configuration</span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            Settings &amp; Integrations
          </h2>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Supabase Cloud Backend Configuration Section (Phase 1) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                Supabase Community Cloud Backend
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isSupabaseConfigured() 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isSupabaseConfigured() ? (
                  <>
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    <span>Configured</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Local Mode</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Connect a Supabase project to enable live crowdsourced reports synced across multiple travelers and devices. (Schema: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">supabase_schema.sql</code>).
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveSupabase}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Credentials
                </button>

                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase || !supabaseUrl.trim() || !supabaseAnonKey.trim()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 disabled:opacity-40"
                >
                  {isTestingSupabase ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>{isTestingSupabase ? 'Testing Connection...' : 'Test Connection'}</span>
                </button>

                {(supabaseUrl || supabaseAnonKey) && (
                  <button
                    type="button"
                    onClick={handleClearSupabase}
                    className="px-2.5 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                    title="Clear credentials"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Notice */}
              {supabaseSaveNotice && (
                <p className="text-xs text-emerald-600 font-semibold animate-fade-in">
                  {supabaseSaveNotice}
                </p>
              )}

              {/* Test Connection Results */}
              {connectionResult && (
                <div className={`p-3 rounded-xl text-xs font-medium border animate-fade-in ${
                  connectionResult.connected 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {connectionResult.connected ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{connectionResult.connected ? 'Connection Succeeded' : 'Connection Failed'}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    {connectionResult.message}
                    {typeof connectionResult.rowCount === 'number' && (
                      <span className="block mt-0.5 font-semibold">
                        Existing community reports in database: {connectionResult.rowCount}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI Architecture Section */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600" />
                AI Intelligence Engine
              </label>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Local Rule-Based Heuristic Active
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              AccessResQ runs an on-device rule-based NLP engine with zero latency, zero external API dependencies, and 100% offline reliability. It performs real-time barrier categorization, severity estimation, and accessible route explainability.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>On-Device NLP &amp; Accessibility Spatial Heuristics</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                External Gemini LLM integration is planned for a future release via a secure server-side/AWS backend proxy. Secret API keys are never stored in frontend code, localStorage, or client environment variables.
              </p>
            </div>
          </div>

          {/* Reset Demo Data Section */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              Reset Demo Data
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Restore initial seed points, route networks, barrier reports, and reset any custom created obstacles.
            </p>
            <button
              onClick={handleResetData}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{resetSuccess ? 'Seed Data Restored!' : 'Restore Default Demo Data'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};


