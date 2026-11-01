import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Sparkles, 
  Camera, 
  MapPin, 
  Check, 
  Layers, 
  HelpCircle,
  FileText,
  Loader2,
  Cloud,
  Database
} from 'lucide-react';
import { BarrierCategory, BarrierReport, BarrierSeverity } from '../../types/community';
import { aiEngineInstance } from '../../services/aiEngine';
import { Coordinate } from '../../types/navigation';
import { StorageService } from '../../services/storageService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { POPULAR_LOCATIONS } from '../../data/locations';

interface ReportBarrierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarrierCreated: (newBarrier: BarrierReport) => void;
  presetLocation?: { name: string; coordinate: Coordinate; affectedSegmentId?: string };
}

export const ReportBarrierModal: React.FC<ReportBarrierModalProps> = ({
  isOpen,
  onClose,
  onBarrierCreated,
  presetLocation
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BarrierCategory>('blocked_ramp');
  const [severity, setSeverity] = useState<BarrierSeverity>('high');
  const [locationName, setLocationName] = useState(presetLocation?.name || 'PSIT Kanpur — Gate 1');
  const [coordinate, setCoordinate] = useState<Coordinate>(presetLocation?.coordinate || { lat: 26.4508, lng: 80.1932 });
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    detectedCategory: string;
    confidence: number;
    keywords: string[];
    isFromApi: boolean;
  } | null>(null);

  if (!isOpen) return null;

  // Run AI classification & summary
  const handleAiAnalyze = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);

    try {
      const classResult = await aiEngineInstance.classifyBarrier(description);
      setCategory(classResult.detectedCategory);
      setSeverity(classResult.suggestedSeverity);
      
      const summaryResult = await aiEngineInstance.summarizeReport(
        title.trim() || 'Accessibility Barrier', 
        description
      );

      if (!title.trim()) {
        setTitle(summaryResult.conciseTitle);
      }

      setAiAnalysisResult({
        detectedCategory: classResult.detectedCategory,
        confidence: classResult.confidence,
        keywords: classResult.extractedKeywords,
        isFromApi: classResult.isFromApi
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate rapid submission
    if (!title.trim() || !description.trim()) {
      alert('Please provide both a title and description of the accessibility barrier.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const newBarrier: BarrierReport = {
      id: `barrier_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      severity,
      status: 'pending',
      coordinate,
      locationName: locationName.trim(),
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      reportedBy: 'Devendra Sharma (Community Contributor)',
      reportedAt: new Date().toISOString(),
      confirmationsCount: 1,
      confirmedByUserIds: ['current_user'],
      affectedRouteSegmentId: presetLocation?.affectedSegmentId
    };

    try {
      const res = await StorageService.addBarrierAsync(newBarrier);
      onBarrierCreated(res.data);
      onClose();
    } catch (err: any) {
      console.error('Error saving barrier:', err);
      setSubmitError(err.message || 'Error publishing barrier report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions: { id: BarrierCategory; label: string }[] = [
    { id: 'blocked_ramp', label: 'Blocked Ramp' },
    { id: 'broken_footpath', label: 'Broken Footpath' },
    { id: 'stairs_no_ramp', label: 'Stairs / No Ramp' },
    { id: 'construction', label: 'Construction Obstruction' },
    { id: 'inaccessible_entrance', label: 'Inaccessible Entrance' },
    { id: 'broken_elevator', label: 'Broken Elevator / Lift' },
    { id: 'high_curb', label: 'High Uncut Curb' },
    { id: 'other', label: 'Other Hazard' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Community Barrier Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-300" />
            Report an Accessibility Barrier
          </h2>
          <p className="text-xs text-amber-100 mt-1 leading-relaxed">
            Help wheelchair and mobility device users navigate safely. Submissions instantly alert nearby travelers and trigger smart rerouting.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Location Picker / Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              Location of Barrier
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Civil Lines Crossing, Pedestrian Ramp"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <select
                onChange={(e) => {
                  const loc = POPULAR_LOCATIONS.find(l => l.id === e.target.value);
                  if (loc) {
                    setLocationName(loc.name);
                    setCoordinate(loc.coordinate);
                  }
                }}
                className="px-2.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 text-slate-700 font-medium focus:outline-none"
              >
                <option value="">Choose landmark...</option>
                {POPULAR_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.shortName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Barrier Description with AI Analyzer button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Describe the Obstruction
              </label>
              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={isAnalyzing || !description.trim()}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 disabled:opacity-40 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg transition"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                {isAnalyzing ? 'Analyzing with AI...' : 'AI Auto-Classify'}
              </button>
            </div>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. The wheelchair ramp is completely blocked by delivery scooters parked on the curb-cut. Wheelchair cannot access the pedestrian footpath."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          {/* AI Extraction Banner */}
          {aiAnalysisResult && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  AI Classification: {aiAnalysisResult.detectedCategory.replace('_', ' ')}
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                  {Math.round(aiAnalysisResult.confidence * 100)}% Confidence ({aiAnalysisResult.isFromApi ? 'Gemini API' : 'Local Heuristic AI'})
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Keywords detected: {aiAnalysisResult.keywords.join(', ')}
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Short Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blocked Curb Ramp at Crossing"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Category Badges */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Barrier Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categoryOptions.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setCategory(opt.id)}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center border transition ${
                    category === opt.id
                      ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Impact / Severity
            </label>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {(['low', 'moderate', 'high', 'impassable'] as BarrierSeverity[]).map(sev => (
                <button
                  type="button"
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider border transition ${
                    severity === sev 
                      ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Photo URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              Photo Verification (Optional URL)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg (or leaves default sample)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {submitError}
            </div>
          )}

          {/* Sync mode notice */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              {isSupabaseConfigured() ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Will push to Supabase Cloud &amp; cache locally</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span>Will persist locally (Supabase not configured)</span>
                </>
              )}
            </span>
            <span className="text-slate-400">Anti-spam verification active</span>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Publishing &amp; Syncing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Publish Community Report</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

