export type MobilityType =
  | 'wheelchair'
  | 'walking_assistance'
  | 'visually_impaired'
  | 'hearing_impaired'
  | 'other'
  | 'none';

export const MOBILITY_TYPE_LABELS: Record<MobilityType, string> = {
  wheelchair: 'Wheelchair user',
  walking_assistance: 'Walking assistance',
  visually_impaired: 'Visually impaired',
  hearing_impaired: 'Hearing impaired',
  other: 'Other assistance',
  none: 'No assistance required'
};

export interface MobilityProfile {
  id?: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  mobilityType?: MobilityType;
  mobilityDevice?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  isAccessibilityAuditor?: boolean;
  isVerifiedHelper?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

