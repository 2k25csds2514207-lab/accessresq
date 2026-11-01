import { Coordinate } from './navigation';

export type BarrierCategory = 
  | 'blocked_ramp'
  | 'broken_footpath'
  | 'stairs_no_ramp'
  | 'construction'
  | 'inaccessible_entrance'
  | 'broken_elevator'
  | 'high_curb'
  | 'other';

export type BarrierSeverity = 'low' | 'moderate' | 'high' | 'impassable';

export type BarrierStatus = 'pending' | 'community_confirmed' | 'verified' | 'resolved';

export interface BarrierReport {
  id: string;
  title: string;
  description: string;
  category: BarrierCategory;
  severity: BarrierSeverity;
  status: BarrierStatus;
  coordinate: Coordinate;
  locationName: string;
  photoUrl?: string;
  reportedBy: string;
  reportedAt: string;
  confirmationsCount: number;
  confirmedByUserIds: string[];
  resolvedAt?: string;
  resolutionNote?: string;
  affectedRouteSegmentId?: string;
  isAiGeneratedSummary?: boolean;
}

export interface VerificationLog {
  id: string;
  barrierId: string;
  previousStatus: BarrierStatus;
  newStatus: BarrierStatus;
  changedBy: string;
  reason: string;
  timestamp: string;
}

