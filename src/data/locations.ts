import { LocationItem } from '../types/navigation';

export const POPULAR_LOCATIONS: LocationItem[] = [
  {
    id: 'psit_kanpur',
    name: 'PSIT Kanpur (Main Campus)',
    shortName: 'PSIT Kanpur',
    category: 'university',
    address: 'NH-19, Bhauti, Kanpur, Uttar Pradesh 209305',
    coordinate: { lat: 26.4499, lng: 80.1925 },
    accessibleFeatures: ['Tactile Paving', 'Step-Free Entrances', 'Campus Electric Shuttles', 'ADA Bathrooms']
  },
  {
    id: 'psit_gate_1',
    name: 'PSIT Kanpur — Gate 1 / Transit Point',
    shortName: 'PSIT Gate 1',
    category: 'university',
    address: 'Gate No. 1, NH-19 Service Lane, Bhauti, Kanpur',
    coordinate: { lat: 26.4508, lng: 80.1932 },
    accessibleFeatures: ['Drop-off Zone', 'Low Curb Ramps', '24/7 Security Booth']
  },
  {
    id: 'z_square_mall',
    name: 'Z Square Mall Kanpur',
    shortName: 'Z Square Mall',
    category: 'mall',
    address: '16/113, MG Road, The Mall, Kanpur, Uttar Pradesh 208001',
    coordinate: { lat: 26.4716, lng: 80.3533 },
    accessibleFeatures: ['Wheelchair Elevators', 'Ramped Entrances', 'Designated WAV Parking', 'Braille Signage']
  },
  {
    id: 'kanpur_central',
    name: 'Kanpur Central Railway Station (Platform 1 Exit)',
    shortName: 'Kanpur Central',
    category: 'transit',
    address: 'Station Road, Mirpur, Kanpur, Uttar Pradesh 208004',
    coordinate: { lat: 26.4539, lng: 80.3513 },
    accessibleFeatures: ['Platform Lifts', 'Escalators with Wheelchair Lock', 'Porter Assistance']
  },
  {
    id: 'moti_jheel',
    name: 'Moti Jheel Park & Promenade',
    shortName: 'Moti Jheel',
    category: 'landmark',
    address: 'Benajhabar Road, Harsh Nagar, Kanpur, Uttar Pradesh 208002',
    coordinate: { lat: 26.4764, lng: 80.3168 },
    accessibleFeatures: ['Paved Pathways', 'Resting Benches', 'Step-Free Lake Promenade']
  },
  {
    id: 'gsvm_medical',
    name: 'GSVM Medical College & Hallet Hospital',
    shortName: 'GSVM Medical College',
    category: 'hospital',
    address: 'Swaroop Nagar, Kanpur, Uttar Pradesh 208002',
    coordinate: { lat: 26.4815, lng: 80.3121 },
    accessibleFeatures: ['Emergency Trauma Ramp', 'Motorized Wheelchair Hub', 'Priority Ambulance Bays']
  },
  {
    id: 'allen_forest_zoo',
    name: 'Allen Forest Zoo (Main Entrance)',
    shortName: 'Allen Forest Zoo',
    category: 'landmark',
    address: 'Zoo Road, Nawabganj, Kanpur, Uttar Pradesh 208002',
    coordinate: { lat: 26.5028, lng: 80.2925 },
    accessibleFeatures: ['Battery Buggy Service', 'Wide Wooden Boardwalks', 'Accessible Restrooms']
  }
];

export const DEFAULT_ORIGIN = POPULAR_LOCATIONS[0]; // PSIT Kanpur
export const DEFAULT_DESTINATION = POPULAR_LOCATIONS[2]; // Z Square Mall

