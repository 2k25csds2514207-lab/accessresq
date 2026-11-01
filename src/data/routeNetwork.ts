import { GraphNode, RouteSegment } from '../types/navigation';

export const GRAPH_NODES: Record<string, GraphNode> = {
  // PSIT Campus Nodes
  'node_psit_main': {
    id: 'node_psit_main',
    name: 'PSIT Main Academic Quad',
    coordinate: { lat: 26.4499, lng: 80.1925 },
    connectedSegments: ['seg_psit_to_gate1_ramp', 'seg_psit_to_gate1_stairs']
  },
  'node_psit_gate1': {
    id: 'node_psit_gate1',
    name: 'PSIT Gate 1 Transit Port',
    coordinate: { lat: 26.4508, lng: 80.1932 },
    connectedSegments: ['seg_psit_to_gate1_ramp', 'seg_psit_to_gate1_stairs', 'seg_bhauti_service_way', 'seg_bhauti_flyover_direct']
  },
  // Highway / Bhauti Nodes
  'node_bhauti_junction': {
    id: 'node_bhauti_junction',
    name: 'Bhauti Hub & Highway Junction',
    coordinate: { lat: 26.4530, lng: 80.2050 },
    connectedSegments: ['seg_bhauti_service_way', 'seg_bhauti_flyover_direct', 'seg_panki_link_smooth', 'seg_panki_link_broken']
  },
  'node_panki_station': {
    id: 'node_panki_station',
    name: 'Panki Accessible Hub',
    coordinate: { lat: 26.4600, lng: 80.2450 },
    connectedSegments: ['seg_panki_link_smooth', 'seg_panki_link_broken', 'seg_rawatpur_bypass_ramp', 'seg_rawatpur_central_road']
  },
  // Urban / Central Kanpur Nodes
  'node_rawatpur': {
    id: 'node_rawatpur',
    name: 'Rawatpur Junction',
    coordinate: { lat: 26.4720, lng: 80.2980 },
    connectedSegments: ['seg_rawatpur_bypass_ramp', 'seg_rawatpur_central_road', 'seg_motijheel_corridor', 'seg_civil_lines_underpass']
  },
  'node_motijheel_corner': {
    id: 'node_motijheel_corner',
    name: 'Moti Jheel Promenade North',
    coordinate: { lat: 26.4764, lng: 80.3168 },
    connectedSegments: ['seg_motijheel_corridor', 'seg_civil_lines_north', 'seg_gsvm_connector']
  },
  'node_civil_lines': {
    id: 'node_civil_lines',
    name: 'Civil Lines Crossing',
    coordinate: { lat: 26.4745, lng: 80.3400 },
    connectedSegments: ['seg_civil_lines_north', 'seg_civil_lines_underpass', 'seg_mg_road_accessible_walk', 'seg_the_mall_stairs_cutoff', 'seg_mall_road_south_ramp', 'seg_gsvm_connector']
  },
  'node_z_square_main': {
    id: 'node_z_square_main',
    name: 'Z Square Mall Plaza Entrance',
    coordinate: { lat: 26.4716, lng: 80.3533 },
    connectedSegments: ['seg_mg_road_accessible_walk', 'seg_the_mall_stairs_cutoff', 'seg_station_zsquare_link', 'seg_mall_road_south_ramp']
  },
  // Station Hub
  'node_kanpur_central': {
    id: 'node_kanpur_central',
    name: 'Kanpur Central North Gate',
    coordinate: { lat: 26.4539, lng: 80.3513 },
    connectedSegments: ['seg_station_zsquare_link', 'seg_civil_lines_underpass']
  }
};

export const INITIAL_SEGMENTS: RouteSegment[] = [
  // 1. PSIT Main to Gate 1 (Ramp Option)
  {
    id: 'seg_psit_to_gate1_ramp',
    fromNodeId: 'node_psit_main',
    toNodeId: 'node_psit_gate1',
    name: 'PSIT West Campus Accessible Walkway (Ramp Grade 1:14)',
    distanceMeters: 380,
    coordinates: [
      { lat: 26.4499, lng: 80.1925 },
      { lat: 26.4503, lng: 80.1928 },
      { lat: 26.4508, lng: 80.1932 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 5.2,
    surface: 'paved_concrete',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 2. PSIT Main to Gate 1 (Stairs Shortcut)
  {
    id: 'seg_psit_to_gate1_stairs',
    fromNodeId: 'node_psit_main',
    toNodeId: 'node_psit_gate1',
    name: 'PSIT East Quad Steps & Direct Arcade',
    distanceMeters: 260,
    coordinates: [
      { lat: 26.4499, lng: 80.1925 },
      { lat: 26.4504, lng: 80.1930 },
      { lat: 26.4508, lng: 80.1932 }
    ],
    stepsCount: 16,
    hasRamp: false,
    surface: 'broken_pavement',
    isWellLit: true,
    vibrationLevel: 'high',
    isVerifiedAccessible: false,
    hasActiveBarrier: false
  },
  // 3. Gate 1 to Bhauti Junction (Smooth service road with dropped curbs)
  {
    id: 'seg_bhauti_service_way',
    fromNodeId: 'node_psit_gate1',
    toNodeId: 'node_bhauti_junction',
    name: 'NH-19 Service Boulevard (Protected Pedestrian & WAV Lane)',
    distanceMeters: 1400,
    coordinates: [
      { lat: 26.4508, lng: 80.1932 },
      { lat: 26.4518, lng: 80.1980 },
      { lat: 26.4530, lng: 80.2050 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 3.5,
    surface: 'asphalt_smooth',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 4. Gate 1 to Bhauti Junction (Old Foot-overbridge with 24 stairs)
  {
    id: 'seg_bhauti_flyover_direct',
    fromNodeId: 'node_psit_gate1',
    toNodeId: 'node_bhauti_junction',
    name: 'Bhauti Highway Overpass (Steep Incline & Footbridge)',
    distanceMeters: 1100,
    coordinates: [
      { lat: 26.4508, lng: 80.1932 },
      { lat: 26.4522, lng: 80.2000 },
      { lat: 26.4530, lng: 80.2050 }
    ],
    stepsCount: 24,
    hasRamp: false,
    surface: 'cobblestone',
    isWellLit: false,
    vibrationLevel: 'high',
    isVerifiedAccessible: false,
    hasActiveBarrier: false
  },
  // 5. Bhauti to Panki (Smooth low vibration asphalt corridor)
  {
    id: 'seg_panki_link_smooth',
    fromNodeId: 'node_bhauti_junction',
    toNodeId: 'node_panki_station',
    name: 'Panki Link Road — Barrier-Free Green Corridor',
    distanceMeters: 4200,
    coordinates: [
      { lat: 26.4530, lng: 80.2050 },
      { lat: 26.4565, lng: 80.2240 },
      { lat: 26.4600, lng: 80.2450 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 4.0,
    surface: 'asphalt_smooth',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 6. Bhauti to Panki (Rough industrial road with high curb stones)
  {
    id: 'seg_panki_link_broken',
    fromNodeId: 'node_bhauti_junction',
    toNodeId: 'node_panki_station',
    name: 'Old Panki Depot Road (Rough Gravel & 25cm Curbs)',
    distanceMeters: 3800,
    coordinates: [
      { lat: 26.4530, lng: 80.2050 },
      { lat: 26.4550, lng: 80.2200 },
      { lat: 26.4600, lng: 80.2450 }
    ],
    stepsCount: 8,
    hasRamp: false,
    surface: 'broken_pavement',
    isWellLit: false,
    vibrationLevel: 'high',
    isVerifiedAccessible: false,
    hasActiveBarrier: false
  },
  // 7. Panki to Rawatpur (Smooth ramped transit avenue)
  {
    id: 'seg_rawatpur_bypass_ramp',
    fromNodeId: 'node_panki_station',
    toNodeId: 'node_rawatpur',
    name: 'Rawatpur Multi-Modal Connector (Step-Free & Tactile)',
    distanceMeters: 5600,
    coordinates: [
      { lat: 26.4600, lng: 80.2450 },
      { lat: 26.4650, lng: 80.2700 },
      { lat: 26.4720, lng: 80.2980 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 4.8,
    surface: 'asphalt_smooth',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 8. Panki to Rawatpur (Central Road with narrow sidewalks and curb barriers)
  {
    id: 'seg_rawatpur_central_road',
    fromNodeId: 'node_panki_station',
    toNodeId: 'node_rawatpur',
    name: 'GT Road Old Arterial (Narrow Sidewalks & Steps)',
    distanceMeters: 5200,
    coordinates: [
      { lat: 26.4600, lng: 80.2450 },
      { lat: 26.4640, lng: 80.2720 },
      { lat: 26.4720, lng: 80.2980 }
    ],
    stepsCount: 14,
    hasRamp: false,
    surface: 'paver_tiles',
    isWellLit: true,
    vibrationLevel: 'medium',
    isVerifiedAccessible: false,
    hasActiveBarrier: false
  },
  // 9. Rawatpur to Moti Jheel Promenade
  {
    id: 'seg_motijheel_corridor',
    fromNodeId: 'node_rawatpur',
    toNodeId: 'node_motijheel_corner',
    name: 'Moti Jheel Accessible Park Promenade',
    distanceMeters: 2100,
    coordinates: [
      { lat: 26.4720, lng: 80.2980 },
      { lat: 26.4740, lng: 80.3080 },
      { lat: 26.4764, lng: 80.3168 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 3.2,
    surface: 'paved_concrete',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 10. Moti Jheel to Civil Lines (North Scenic Step-Free Way)
  {
    id: 'seg_civil_lines_north',
    fromNodeId: 'node_motijheel_corner',
    toNodeId: 'node_civil_lines',
    name: 'Swaroop Nagar — Civil Lines Boulevard (Accessible Ramp Network)',
    distanceMeters: 2600,
    coordinates: [
      { lat: 26.4764, lng: 80.3168 },
      { lat: 26.4755, lng: 80.3280 },
      { lat: 26.4745, lng: 80.3400 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 3.8,
    surface: 'asphalt_smooth',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 11. Rawatpur to Civil Lines (Underpass direct - potentially obstructed by construction)
  {
    id: 'seg_civil_lines_underpass',
    fromNodeId: 'node_rawatpur',
    toNodeId: 'node_civil_lines',
    name: 'Rawatpur Underpass Subway Link',
    distanceMeters: 4100,
    coordinates: [
      { lat: 26.4720, lng: 80.2980 },
      { lat: 26.4730, lng: 80.3200 },
      { lat: 26.4745, lng: 80.3400 }
    ],
    stepsCount: 18,
    hasRamp: false,
    surface: 'broken_pavement',
    isWellLit: false,
    vibrationLevel: 'high',
    isVerifiedAccessible: false,
    hasActiveBarrier: false
  },
  // 12. Civil Lines to Z Square Mall (Accessible MG Road Walkway)
  {
    id: 'seg_mg_road_accessible_walk',
    fromNodeId: 'node_civil_lines',
    toNodeId: 'node_z_square_main',
    name: 'MG Road Smart City Pedestrian Promenade (Drop-Curbs & Audio Beacons)',
    distanceMeters: 1450,
    coordinates: [
      { lat: 26.4745, lng: 80.3400 },
      { lat: 26.4730, lng: 80.3470 },
      { lat: 26.4716, lng: 80.3533 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 4.1,
    surface: 'paved_concrete',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 13. Civil Lines to Z Square Mall (The Mall stairs cut-off)
  {
    id: 'seg_the_mall_stairs_cutoff',
    fromNodeId: 'node_civil_lines',
    toNodeId: 'node_z_square_main',
    name: 'Old Mall Market Steps & Pedestrian Bridge',
    distanceMeters: 1150,
    coordinates: [
      { lat: 26.4745, lng: 80.3400 },
      { lat: 26.4725, lng: 80.3460 },
      { lat: 26.4716, lng: 80.3533 }
    ],
    stepsCount: 22,
    hasRamp: false,
    surface: 'cobblestone',
    isWellLit: true,
    vibrationLevel: 'medium',
    isVerifiedAccessible: false,
    hasActiveBarrier: false
  },
  // 14. Station to Z Square Link
  {
    id: 'seg_station_zsquare_link',
    fromNodeId: 'node_kanpur_central',
    toNodeId: 'node_z_square_main',
    name: 'Station Road Direct Ramped Pathway',
    distanceMeters: 2100,
    coordinates: [
      { lat: 26.4539, lng: 80.3513 },
      { lat: 26.4620, lng: 80.3520 },
      { lat: 26.4716, lng: 80.3533 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 4.5,
    surface: 'asphalt_smooth',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 15. Civil Lines to Z Square South Ramped Bypass (used when MG road is blocked)
  {
    id: 'seg_mall_road_south_ramp',
    fromNodeId: 'node_civil_lines',
    toNodeId: 'node_z_square_main',
    name: 'Phool Bagh — VIP Road South Ramped Promenade (Step-Free Bypass)',
    distanceMeters: 1850,
    coordinates: [
      { lat: 26.4745, lng: 80.3400 },
      { lat: 26.4690, lng: 80.3440 },
      { lat: 26.4675, lng: 80.3500 },
      { lat: 26.4716, lng: 80.3533 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 3.8,
    surface: 'asphalt_smooth',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  },
  // 16. Moti Jheel to Civil Lines via Swaroop Nagar Medical Campus
  {
    id: 'seg_gsvm_connector',
    fromNodeId: 'node_motijheel_corner',
    toNodeId: 'node_civil_lines',
    name: 'Swaroop Nagar — Medical Campus Ramped Bypass',
    distanceMeters: 3100,
    coordinates: [
      { lat: 26.4764, lng: 80.3168 },
      { lat: 26.4800, lng: 80.3240 },
      { lat: 26.4770, lng: 80.3340 },
      { lat: 26.4745, lng: 80.3400 }
    ],
    stepsCount: 0,
    hasRamp: true,
    rampSlopePercent: 3.5,
    surface: 'asphalt_smooth',
    isWellLit: true,
    vibrationLevel: 'low',
    isVerifiedAccessible: true,
    hasActiveBarrier: false
  }
];

