import { Coordinate } from './navigation';

export type RescueServiceType = 
  | 'flat_tyre'
  | 'battery_jump'
  | 'towing'
  | 'basic_repair'
  | 'wav_assistance'; // Wheelchair-accessible vehicle or electric wheelchair repair

export type VehicleType = 
  | 'manual_wheelchair'
  | 'power_wheelchair'
  | 'mobility_scooter'
  | 'accessible_van'
  | 'standard_car';

export type RequestStatus = 
  | 'searching'
  | 'assigned'
  | 'in_transit'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface RescueProvider {
  id: string;
  name: string;
  companyName: string;
  rating: number;
  reviewCount: number;
  services: RescueServiceType[];
  phone: string;
  coordinate: Coordinate;
  distanceKm: number;
  estimatedArrivalMinutes: number;
  hasWheelchairHoistLift: boolean;
  hasRampEquipment: boolean;
  isMobilityCertified: boolean;
  isVerifiedPartner: boolean;
  vehiclePlate: string;
  driverName: string;
  avatarUrl?: string;
  bio: string;
}

export interface RescueRequest {
  id: string;
  serviceType: RescueServiceType;
  vehicleType: VehicleType;
  locationName: string;
  coordinate: Coordinate;
  hasWheelchairHoistRequired: boolean;
  userName: string;
  userPhone: string;
  urgency: 'critical' | 'standard' | 'scheduled';
  notes?: string;
  status: RequestStatus;
  matchedProvider?: RescueProvider;
  requestedAt: string;
  updatedAt: string;
}

