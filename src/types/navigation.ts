export interface Coordinate {
  lat: number;
  lng: number;
}

export interface LocationItem {
  id: string;
  name: string;
  shortName: string;
  category: 'university' | 'mall' | 'transit' | 'landmark' | 'hospital' | 'other';
  address: string;
  coordinate: Coordinate;
  accessibleFeatures: string[];
}

export interface RoutePreferences {
  avoidStairs: boolean;
  stepFreeAccess: boolean;
  preferRamps: boolean;
  smoothSurfaces: boolean;
  wellLitRoutes: boolean;
  lowerVibration: boolean;
  wheelchairMode: boolean;
  wheelchairType: 'manual' | 'electric' | 'scooter';
  maxSlopeGradient?: number; // percentage, e.g. 8%
}

export type SurfaceType = 'asphalt_smooth' | 'paved_concrete' | 'paver_tiles' | 'cobblestone' | 'gravel' | 'broken_pavement';

export interface RouteSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  name: string;
  distanceMeters: number;
  coordinates: Coordinate[];
  stepsCount: number;
  hasRamp: boolean;
  rampSlopePercent?: number;
  surface: SurfaceType;
  isWellLit: boolean;
  vibrationLevel: 'low' | 'medium' | 'high';
  isVerifiedAccessible: boolean;
  hasActiveBarrier: boolean;
  barrierDescription?: string;
  barrierId?: string;
}

export interface GraphNode {
  id: string;
  name: string;
  coordinate: Coordinate;
  connectedSegments: string[];
}

export interface RouteOption {
  id: string;
  title: string;
  isRecommended: boolean;
  totalDistanceMeters: number;
  estimatedDurationMinutes: number;
  stepsCount: number;
  rampsCount: number;
  smoothSurfacePercentage: number;
  accessibilityScore: number; // 0 - 100
  segments: RouteSegment[];
  coordinates: Coordinate[];
  turnByTurn: {
    instruction: string;
    distanceMeters: number;
    icon: 'start' | 'straight' | 'ramp' | 'turn_left' | 'turn_right' | 'stairs_warning' | 'finish';
    isAccessible: boolean;
    note?: string;
  }[];
  explanationReasons: string[];
  warnings: string[];
  isRerouted?: boolean;
  rerouteReason?: string;
}

export interface RouteCalculationResult {
  recommendedRoute: RouteOption;
  alternativeRoute?: RouteOption;
  origin: LocationItem;
  destination: LocationItem;
  preferences: RoutePreferences;
  calculatedAt: string;
}

