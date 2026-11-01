import { BarrierReport } from '../types/community';
import { RescueRequest } from '../types/rescue';
import { RoutePreferences } from '../types/navigation';
import { MobilityProfile } from '../types/profile';
import { INITIAL_BARRIER_REPORTS } from '../data/communityReports';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  BARRIERS: 'accessresq_barriers_v1',
  RESCUE_REQUESTS: 'accessresq_rescue_requests_v1',
  PREFERENCES: 'accessresq_preferences_v1',
  SOS_PROFILE: 'accessresq_sos_profile_v1',
  HIGH_CONTRAST: 'accessresq_high_contrast_v1',
  LOCAL_UPVOTES: 'accessresq_local_upvotes_v1'
};

export const DEFAULT_PREFERENCES: RoutePreferences = {
  avoidStairs: true,
  stepFreeAccess: true,
  preferRamps: true,
  smoothSurfaces: true,
  wellLitRoutes: false,
  lowerVibration: true,
  wheelchairMode: true,
  wheelchairType: 'manual',
  maxSlopeGradient: 6
};

export interface UserSOSProfile {
  name: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone: string;
  wheelchairModel: string;
  bloodGroup: string;
  medicalNotes: string;
  mobilityType?: string;
}

export const DEFAULT_SOS_PROFILE: UserSOSProfile = {
  name: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  wheelchairModel: '',
  bloodGroup: '',
  medicalNotes: '',
  mobilityType: ''
};

// Database row mapper functions
export function mapRowToBarrierReport(row: any): BarrierReport {
  return {
    id: String(row.id),
    title: row.title || 'Untitled Obstacle',
    description: row.description || '',
    category: row.category || 'other',
    severity: row.severity || 'moderate',
    status: row.status || 'pending',
    coordinate: {
      lat: Number(row.latitude) || 26.4508,
      lng: Number(row.longitude) || 80.1932
    },
    locationName: row.location_name || 'Kanpur Region',
    photoUrl: row.photo_url || undefined,
    reportedBy: row.reported_by_name || 'Community Contributor',
    reportedAt: row.created_at || new Date().toISOString(),
    confirmationsCount: Number(row.confirmations_count) || 1,
    confirmedByUserIds: [],
    resolvedAt: row.resolved_at || undefined,
    resolutionNote: row.resolution_note || undefined,
    affectedRouteSegmentId: row.affected_route_segment_id || undefined
  };
}

export function mapBarrierReportToRow(barrier: BarrierReport): any {
  return {
    title: barrier.title,
    description: barrier.description,
    category: barrier.category,
    severity: barrier.severity,
    status: barrier.status,
    latitude: barrier.coordinate.lat,
    longitude: barrier.coordinate.lng,
    location_name: barrier.locationName,
    photo_url: barrier.photoUrl || null,
    reported_by_name: barrier.reportedBy,
    confirmations_count: barrier.confirmationsCount,
    affected_route_segment_id: barrier.affectedRouteSegmentId || null
  };
}

export class StorageService {
  // --------------------------------------------------------------------------
  // SYNCHRONOUS METHODS (Offline / Instant Cache)
  // --------------------------------------------------------------------------
  public static getBarriers(): BarrierReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BARRIERS);
      if (!data) {
        this.saveBarriers(INITIAL_BARRIER_REPORTS);
        return INITIAL_BARRIER_REPORTS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_BARRIER_REPORTS;
    } catch {
      return INITIAL_BARRIER_REPORTS;
    }
  }

  public static saveBarriers(barriers: BarrierReport[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BARRIERS, JSON.stringify(barriers));
    } catch (e) {
      console.error('Failed to save barriers to localStorage', e);
    }
  }

  public static addBarrier(barrier: BarrierReport): void {
    const list = this.getBarriers();
    list.unshift(barrier);
    this.saveBarriers(list);
  }

  public static updateBarrier(updated: BarrierReport): void {
    const list = this.getBarriers().map(b => b.id === updated.id ? updated : b);
    this.saveBarriers(list);
  }

  // Local user upvotes tracking (to prevent repeat confirmations in demo sessions)
  public static getLocalUpvotes(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCAL_UPVOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static recordLocalUpvote(barrierId: string): void {
    const list = this.getLocalUpvotes();
    if (!list.includes(barrierId)) {
      list.push(barrierId);
      localStorage.setItem(STORAGE_KEYS.LOCAL_UPVOTES, JSON.stringify(list));
    }
  }

  public static hasUserUpvoted(barrierId: string): boolean {
    return this.getLocalUpvotes().includes(barrierId);
  }

  // --------------------------------------------------------------------------
  // ASYNCHRONOUS SUPABASE METHODS (Cloud Synchronization)
  // --------------------------------------------------------------------------
  public static async fetchBarriersFromCloud(): Promise<{
    data: BarrierReport[];
    isCloud: boolean;
    error?: string;
  }> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return {
        data: this.getBarriers(),
        isCloud: false
      };
    }

    try {
      const { data, error } = await client
        .from('community_barriers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[AccessResQ Supabase] Error fetching barriers:', error.message);
        return {
          data: this.getBarriers(),
          isCloud: false,
          error: error.message
        };
      }

      if (!data || data.length === 0) {
        // If cloud table is empty, seed it with initial reports so it's not blank
        console.log('[AccessResQ Supabase] Cloud table is empty, using initial seed data.');
        return {
          data: this.getBarriers(),
          isCloud: true
        };
      }

      const mappedReports = data.map(mapRowToBarrierReport);
      // Update local storage cache with latest cloud data
      this.saveBarriers(mappedReports);

      return {
        data: mappedReports,
        isCloud: true
      };
    } catch (err: any) {
      console.warn('[AccessResQ Supabase] Network exception fetching barriers:', err);
      return {
        data: this.getBarriers(),
        isCloud: false,
        error: err.message || String(err)
      };
    }
  }

  public static async addBarrierAsync(barrier: BarrierReport): Promise<{
    success: boolean;
    data: BarrierReport;
    isCloud: boolean;
    error?: string;
  }> {
    // 1. Always save locally immediately
    this.addBarrier(barrier);

    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return {
        success: true,
        data: barrier,
        isCloud: false
      };
    }

    try {
      const row = mapBarrierReportToRow(barrier);
      const { data, error } = await client
        .from('community_barriers')
        .insert([row])
        .select()
        .single();

      if (error) {
        console.warn('[AccessResQ Supabase] Error inserting barrier:', error.message);
        return {
          success: true,
          data: barrier,
          isCloud: false,
          error: error.message
        };
      }

      const cloudBarrier = mapRowToBarrierReport(data);
      // Replace temporary local ID with Supabase UUID
      this.updateBarrier(cloudBarrier);

      return {
        success: true,
        data: cloudBarrier,
        isCloud: true
      };
    } catch (err: any) {
      console.warn('[AccessResQ Supabase] Network error creating barrier in cloud:', err);
      return {
        success: true,
        data: barrier,
        isCloud: false,
        error: err.message || String(err)
      };
    }
  }

  // Retrieve or generate a persistent anonymous device token for upvote deduplication
  public static getClientIdentifier(): string {
    const KEY = 'accessresq_device_client_id_v1';
    try {
      let id = localStorage.getItem(KEY);
      if (!id) {
        id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch {
      return 'anonymous_client_session';
    }
  }

  public static async confirmBarrierAsync(barrier: BarrierReport): Promise<{
    success: boolean;
    updatedBarrier: BarrierReport;
    isCloud: boolean;
    error?: string;
  }> {
    // 1. Update local cache immediately
    const newCount = barrier.confirmationsCount + 1;
    let newStatus = barrier.status;
    if (barrier.status === 'pending' && newCount >= 3) {
      newStatus = 'community_confirmed';
    }

    const updated: BarrierReport = {
      ...barrier,
      confirmationsCount: newCount,
      status: newStatus
    };

    this.updateBarrier(updated);
    this.recordLocalUpvote(barrier.id);

    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return {
        success: true,
        updatedBarrier: updated,
        isCloud: false
      };
    }

    try {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(barrier.id);

      if (isUuid) {
        // Execute atomic, deduplicated confirmation via secure RPC
        const clientId = this.getClientIdentifier();
        const { data, error } = await client.rpc('confirm_barrier_safely', {
          p_barrier_id: barrier.id,
          p_client_identifier: clientId
        });

        if (error) {
          console.warn('[AccessResQ Supabase] Confirmation RPC notice:', error.message);
          return {
            success: true,
            updatedBarrier: updated,
            isCloud: false,
            error: error.message
          };
        }

        // Apply authoritative count and status from database response
        if (data && typeof data.confirmations_count === 'number') {
          const cloudConfirmed: BarrierReport = {
            ...barrier,
            confirmationsCount: data.confirmations_count,
            status: (data.status as any) || newStatus
          };
          this.updateBarrier(cloudConfirmed);
          return {
            success: true,
            updatedBarrier: cloudConfirmed,
            isCloud: true
          };
        }
      }

      return {
        success: true,
        updatedBarrier: updated,
        isCloud: true
      };
    } catch (err: any) {
      return {
        success: true,
        updatedBarrier: updated,
        isCloud: false,
        error: err.message || String(err)
      };
    }
  }

  public static async resolveBarrierAsync(barrier: BarrierReport, note: string): Promise<{
    success: boolean;
    updatedBarrier: BarrierReport;
    isCloud: boolean;
    error?: string;
  }> {
    const resolvedAt = new Date().toISOString();
    const resolutionNote = note.trim() || 'Barrier cleared by community contributor.';

    // 1. Update local state immediately for uninterrupted demo experience
    const updated: BarrierReport = {
      ...barrier,
      status: 'resolved',
      resolvedAt,
      resolutionNote
    };

    this.updateBarrier(updated);

    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return {
        success: true,
        updatedBarrier: updated,
        isCloud: false
      };
    }

    try {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(barrier.id);

      if (isUuid) {
        // Attempt authorized resolution via RPC (restricted to verified auditors / backend)
        const { data, error } = await client.rpc('resolve_barrier_safely', {
          p_barrier_id: barrier.id,
          p_resolution_note: resolutionNote
        });

        if (error) {
          // If unauthorized (e.g. ordinary anonymous user in demo session), record warning
          console.warn('[AccessResQ Supabase] Resolution RPC notice:', error.message);
          return {
            success: true,
            updatedBarrier: updated,
            isCloud: false,
            error: 'Cloud resolution requires auditor permissions. Updated in local demo session.'
          };
        }

        if (data && data.success) {
          const finalResolved: BarrierReport = {
            ...updated,
            resolutionNote: data.resolution_note || resolutionNote,
            resolvedAt: data.resolved_at || resolvedAt
          };
          this.updateBarrier(finalResolved);
          return {
            success: true,
            updatedBarrier: finalResolved,
            isCloud: true
          };
        }
      }

      return {
        success: true,
        updatedBarrier: updated,
        isCloud: true
      };
    } catch (err: any) {
      return {
        success: true,
        updatedBarrier: updated,
        isCloud: false,
        error: err.message || String(err)
      };
    }
  }

  // --------------------------------------------------------------------------
  // RESCUE REQUESTS (Preserved)
  // --------------------------------------------------------------------------
  public static getRescueRequests(): RescueRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESCUE_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveRescueRequests(requests: RescueRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RESCUE_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save rescue requests to localStorage', e);
    }
  }

  public static addRescueRequest(req: RescueRequest): void {
    const list = this.getRescueRequests();
    list.unshift(req);
    this.saveRescueRequests(list);
  }

  public static updateRescueRequest(req: RescueRequest): void {
    const list = this.getRescueRequests().map(r => r.id === req.id ? req : r);
    this.saveRescueRequests(list);
  }

  // --------------------------------------------------------------------------
  // USER PREFERENCES (Preserved)
  // --------------------------------------------------------------------------
  public static getPreferences(): RoutePreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  public static savePreferences(prefs: RoutePreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences', e);
    }
  }

  // --------------------------------------------------------------------------
  // SOS PROFILE (Preserved)
  // --------------------------------------------------------------------------
  public static getSOSProfile(): UserSOSProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SOS_PROFILE);
      return data ? { ...DEFAULT_SOS_PROFILE, ...JSON.parse(data) } : DEFAULT_SOS_PROFILE;
    } catch {
      return DEFAULT_SOS_PROFILE;
    }
  }

  public static saveSOSProfile(profile: UserSOSProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SOS_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save SOS profile', e);
    }
  }

  // --------------------------------------------------------------------------
  // CLOUD MOBILITY PROFILE METHODS
  // --------------------------------------------------------------------------
  public static async fetchProfileAsync(userId: string): Promise<MobilityProfile | null> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured() || !userId) {
      const sos = this.getSOSProfile();
      if (!sos.name && !sos.phone && !sos.emergencyContactName) return null;
      return {
        userId,
        fullName: sos.name,
        email: '',
        phone: sos.phone,
        mobilityType: (sos.mobilityType as any) || undefined,
        mobilityDevice: sos.wheelchairModel || undefined,
        bloodGroup: sos.bloodGroup || undefined,
        medicalNotes: sos.medicalNotes || undefined,
        emergencyContactName: sos.emergencyContactName || undefined,
        emergencyContactRelationship: sos.emergencyContactRelationship || undefined,
        emergencyContactPhone: sos.emergencyContactPhone || undefined
      };
    }

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.id,
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || undefined,
        avatarUrl: data.avatar_url || undefined,
        mobilityType: data.mobility_type || undefined,
        mobilityDevice: data.mobility_device || undefined,
        bloodGroup: data.blood_group || undefined,
        medicalNotes: data.medical_notes || undefined,
        emergencyContactName: data.emergency_contact_name || undefined,
        emergencyContactRelationship: data.emergency_contact_relationship || undefined,
        emergencyContactPhone: data.emergency_contact_phone || undefined,
        isAccessibilityAuditor: data.is_accessibility_auditor,
        isVerifiedHelper: data.is_verified_helper,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.warn('[AccessResQ Supabase] fetchProfileAsync error:', err);
      return null;
    }
  }

  public static async saveProfileAsync(profile: MobilityProfile): Promise<{ success: boolean; error?: string }> {
    this.saveSOSProfile({
      name: profile.fullName || '',
      phone: profile.phone || '',
      emergencyContactName: profile.emergencyContactName || '',
      emergencyContactRelationship: profile.emergencyContactRelationship || '',
      emergencyContactPhone: profile.emergencyContactPhone || '',
      wheelchairModel: profile.mobilityDevice || '',
      bloodGroup: profile.bloodGroup || '',
      medicalNotes: profile.medicalNotes || '',
      mobilityType: profile.mobilityType || ''
    });

    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured() || !profile.userId) {
      return { success: true };
    }

    try {
      const payload: any = {
        id: profile.userId,
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone || null,
        mobility_type: profile.mobilityType || null,
        mobility_device: profile.mobilityDevice || null,
        blood_group: profile.bloodGroup || null,
        medical_notes: profile.medicalNotes || null,
        emergency_contact_name: profile.emergencyContactName || null,
        emergency_contact_relationship: profile.emergencyContactRelationship || null,
        emergency_contact_phone: profile.emergencyContactPhone || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await client
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('[AccessResQ Supabase] saveProfileAsync error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  // --------------------------------------------------------------------------
  // RESET DEMO DEFAULTS
  // --------------------------------------------------------------------------
  public static resetToDemoDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.BARRIERS);
    localStorage.removeItem(STORAGE_KEYS.RESCUE_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_UPVOTES);
    this.saveBarriers(INITIAL_BARRIER_REPORTS);
  }
}
