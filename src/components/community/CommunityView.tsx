import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  ThumbsUp, 
  MapPin, 
  Filter, 
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cloud,
  Database,
  Check,
  Loader2
} from 'lucide-react';
import { BarrierCategory, BarrierReport, BarrierStatus } from '../../types/community';
import { StorageService } from '../../services/storageService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { LeafletMap } from '../common/LeafletMap';

interface CommunityViewProps {
  barriers: BarrierReport[];
  onBarriersChange: (barriers: BarrierReport[]) => void;
  onOpenReportBarrier: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  barriers = [],
  onBarriersChange,
  onOpenReportBarrier
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cloud Sync state
  const [isCloud, setIsCloud] = useState<boolean>(isSupabaseConfigured());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch barriers from Supabase cloud on initial mount
  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      setIsRefreshing(true);
      try {
        const res = await StorageService.fetchBarriersFromCloud();
        if (!isMounted) return;
        setIsCloud(res.isCloud);
        if (res.error) {
          setSyncError(res.error);
        } else {
          setSyncError(null);
          onBarriersChange(res.data);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSyncError(err.message || 'Sync failed');
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    };

    fetchLatest();
    return () => { isMounted = false; };
  }, []);

  // Manual refresh action
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setSyncFeedback(null);
    try {
      const res = await StorageService.fetchBarriersFromCloud();
      setIsCloud(res.isCloud);
      if (res.error) {
        setSyncError(res.error);
        setSyncFeedback('Could not reach Supabase; showing cached local reports.');
      } else {
        setSyncError(null);
        onBarriersChange(res.data);
        setSyncFeedback(
          res.isCloud
            ? `Synced ${res.data.length} reports from Supabase Cloud.`
            : `Refreshed ${res.data.length} reports from Local Storage.`
        );
      }
    } catch (err: any) {
      setSyncError(err.message || 'Failed to refresh reports');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const formatReportDate = (d?: string) => {
    if (!d) return 'Recently';
    try {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? 'Recently' : parsed.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  // Handle "+1 Confirm" / Upvote
  const handleConfirmBarrier = async (barrier: BarrierReport) => {
    if (StorageService.hasUserUpvoted(barrier.id)) {
      alert('You have already confirmed this barrier in this session.');
      return;
    }

    setActionLoadingId(barrier.id);
    try {
      const result = await StorageService.confirmBarrierAsync(barrier);
      const updatedList = (barriers || []).map(b => b.id === barrier.id ? result.updatedBarrier : b);
      onBarriersChange(updatedList);
      if (result.isCloud) {
        setSyncFeedback('Confirmation synced to Supabase Cloud!');
        setTimeout(() => setSyncFeedback(null), 3000);
      } else if (result.error) {
        setSyncFeedback(`Saved to local session (${result.error})`);
        setTimeout(() => setSyncFeedback(null), 4500);
      }
    } catch (e: any) {
      console.error('Error confirming barrier:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Mark Resolved
  const handleMarkResolved = async (barrier: BarrierReport) => {
    const note = prompt('Enter a resolution note (e.g. "Curb cleared, ramp unobstructed"):');
    if (note === null) return;

    setActionLoadingId(barrier.id);
    try {
      const result = await StorageService.resolveBarrierAsync(barrier, note);
      const updatedList = (barriers || []).map(b => b.id === barrier.id ? result.updatedBarrier : b);
      onBarriersChange(updatedList);
      if (result.isCloud) {
        setSyncFeedback('Resolution status synced to Supabase Cloud!');
        setTimeout(() => setSyncFeedback(null), 3000);
      } else if (result.error) {
        setSyncFeedback(`Updated locally (${result.error})`);
        setTimeout(() => setSyncFeedback(null), 4500);
      }
    } catch (e: any) {
      console.error('Error resolving barrier:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Safe filter list
  const safeBarriersList = Array.isArray(barriers) ? barriers : [];
  const filteredBarriers = safeBarriersList.filter(b => {
    if (!b) return false;
    if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (b.title || '').toLowerCase().includes(q);
      const matchDesc = (b.description || '').toLowerCase().includes(q);
      const matchLoc = (b.locationName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'blocked_ramp', label: 'Blocked Ramps' },
    { id: 'broken_footpath', label: 'Broken Footpaths' },
    { id: 'stairs_no_ramp', label: 'Stairs / No Ramp' },
    { id: 'construction', label: 'Construction' },
    { id: 'broken_elevator', label: 'Elevators' },
    { id: 'high_curb', label: 'High Curbs' },
  ];

  const statuses: { id: string; label: string }[] = [
    { id: 'all', label: 'All Statuses' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'community_confirmed', label: 'Community Confirmed' },
    { id: 'verified', label: 'Verified by City' },
    { id: 'resolved', label: 'Resolved' },
  ];

  const getStatusBadge = (status: BarrierStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified by City
          </span>
        );
      case 'community_confirmed':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            Community Confirmed
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-slate-100 text-slate-800 text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Community Accessibility Barrier Hub
            </h1>

            {/* Cloud Sync Status Indicator Badge */}
            {isCloud ? (
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold"
                title="Connected to Supabase PostgreSQL database. Reports sync across all browsers and devices."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                Cloud Synced (Supabase Active)
              </span>
            ) : (
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold"
                title="Running in local storage fallback mode. Add Supabase credentials in Settings to enable cross-device synchronization."
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <Database className="w-3.5 h-3.5 text-amber-600" />
                Local Storage Mode (Offline / Demo)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Crowdsourced accessibility auditing. Report hazards, verify with +1 confirmations, and feed live data into the navigation routing engine.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Manual Refresh / Re-sync Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 disabled:opacity-50"
            title="Fetch latest barrier reports from Supabase / Local Storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={onOpenReportBarrier}
            className="py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-md shadow-amber-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Report New Barrier
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast / Banner */}
      {syncFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{syncFeedback}</span>
          </div>
          <button 
            onClick={() => setSyncFeedback(null)} 
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sync Error Notice */}
      {syncError && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Cloud sync notice: {syncError}. The app is smoothly operating using local cached data.
            </span>
          </div>
          <button 
            onClick={() => setSyncError(null)} 
            className="text-amber-700 hover:text-amber-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Filters & Feed + Live Barrier Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Filter Controls & Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search & Category Filter Pills */}
          <div className="bg-white p-4 rounded-3xl shadow-card border border-slate-200/80 space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by street, obstacle, or landmark..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
              {statuses.map(st => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedStatus === st.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
              <span>Community Reports ({filteredBarriers.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">Real-time crowdsourced feed</span>
            </div>

            {filteredBarriers.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No accessibility reports match this filter.</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); setSearchQuery(''); }}
                  className="text-xs font-bold text-brand-700 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredBarriers.map(barrier => (
                <div
                  key={barrier.id}
                  className="bg-white p-5 rounded-3xl shadow-card border border-slate-200/80 space-y-3 transition hover:border-slate-300"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(barrier.status)}
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {barrier.category.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          barrier.severity === 'impassable' ? 'bg-rose-100 text-rose-800' :
                          barrier.severity === 'high' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {barrier.severity}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 pt-1">
                        {barrier.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        {barrier.locationName}
                      </p>
                    </div>

                    {/* Upvote Confirm Count */}
                    <div className="text-right flex-shrink-0">
                      <button
                        onClick={() => handleConfirmBarrier(barrier)}
                        disabled={actionLoadingId === barrier.id || StorageService.hasUserUpvoted(barrier.id)}
                        className={`py-1.5 px-3 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                          StorageService.hasUserUpvoted(barrier.id)
                            ? 'bg-amber-100 text-amber-900 border-amber-300 cursor-default'
                            : 'bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-800'
                        }`}
                        title={
                          StorageService.hasUserUpvoted(barrier.id)
                            ? 'You have confirmed this barrier'
                            : 'Confirm this barrier exists (+1 to verification)'
                        }
                      >
                        {actionLoadingId === barrier.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        ) : (
                          <ThumbsUp className={`w-3.5 h-3.5 ${StorageService.hasUserUpvoted(barrier.id) ? 'text-amber-700 fill-amber-700' : 'text-amber-600'}`} />
                        )}
                        <span>+{barrier.confirmationsCount}</span>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {barrier.description}
                  </p>

                  {/* Optional Photo Thumbnail */}
                  {barrier.photoUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 h-36 w-full">
                      <img
                        src={barrier.photoUrl}
                        alt="Barrier photograph"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Resolution note if resolved */}
                  {barrier.status === 'resolved' && barrier.resolutionNote && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <strong>Resolution Note:</strong> {barrier.resolutionNote}
                    </div>
                  )}

                  {/* Footer info & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      <span>Reported by <strong>{barrier.reportedBy || 'Community Volunteer'}</strong></span>
                      <span> • {formatReportDate(barrier.reportedAt)}</span>
                    </div>

                    {barrier.status !== 'resolved' && (
                      <button
                        onClick={() => handleMarkResolved(barrier)}
                        disabled={actionLoadingId === barrier.id}
                        className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        {actionLoadingId === barrier.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                        Mark Resolved
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Column: Spatial Map of Reported Barriers (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white p-3 rounded-3xl shadow-card border border-slate-200/80 space-y-2 sticky top-24">
            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Active Barrier Spatial Map ({barriers.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Click pin to inspect
              </span>
            </div>

            <LeafletMap
              barriers={filteredBarriers}
              className="h-[460px] w-full rounded-2xl"
            />

            {/* Verification Rule Notice */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                Anti-Spam Verification Protocol
              </div>
              <p className="text-[11px] leading-relaxed">
                Reports begin as <strong>Pending</strong>. When 3 or more local travelers confirm via the "+1 Confirm" button, it advances to <strong>Community Confirmed</strong>. City accessibility coordinators can mark it <strong>Verified</strong> or <strong>Resolved</strong>.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

