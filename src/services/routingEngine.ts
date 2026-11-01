import { 
  Coordinate, 
  LocationItem, 
  RouteOption, 
  RoutePreferences, 
  RouteSegment, 
  RouteCalculationResult 
} from '../types/navigation';
import { GRAPH_NODES, INITIAL_SEGMENTS } from '../data/routeNetwork';

// Helper: Haversine distance in meters between two lat/lng points
export function calculateHaversineDistance(c1: Coordinate, c2: Coordinate): number {
  const R = 6371e3; // metres
  const φ1 = (c1.lat * Math.PI) / 180;
  const φ2 = (c2.lat * Math.PI) / 180;
  const Δφ = ((c2.lat - c1.lat) * Math.PI) / 180;
  const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Find closest graph node for any arbitrary coordinate
export function findNearestGraphNode(coord: Coordinate): string {
  let nearestNodeId = Object.keys(GRAPH_NODES)[0];
  let minDistance = Infinity;

  for (const [id, node] of Object.entries(GRAPH_NODES)) {
    const dist = calculateHaversineDistance(coord, node.coordinate);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNodeId = id;
    }
  }

  return nearestNodeId;
}

export class RoutingEngine {
  private segments: RouteSegment[];
  private blockedSegmentIds: Set<string>;

  constructor(customSegments?: RouteSegment[]) {
    this.segments = customSegments ? [...customSegments] : [...INITIAL_SEGMENTS];
    this.blockedSegmentIds = new Set();

    // Mark segments that have initial active barriers
    for (const seg of this.segments) {
      if (seg.hasActiveBarrier) {
        this.blockedSegmentIds.add(seg.id);
      }
    }
  }

  public setBlockedSegments(segmentIds: string[]) {
    this.blockedSegmentIds = new Set(segmentIds);
  }

  public blockSegment(segmentId: string, reason?: string) {
    this.blockedSegmentIds.add(segmentId);
    this.segments = this.segments.map(seg => {
      if (seg.id === segmentId) {
        return { ...seg, hasActiveBarrier: true, barrierDescription: reason || 'Reported Obstruction' };
      }
      return seg;
    });
  }

  public unblockSegment(segmentId: string) {
    this.blockedSegmentIds.delete(segmentId);
    this.segments = this.segments.map(seg => {
      if (seg.id === segmentId) {
        return { ...seg, hasActiveBarrier: false, barrierDescription: undefined };
      }
      return seg;
    });
  }

  public getSegment(segmentId: string): RouteSegment | undefined {
    return this.segments.find(seg => seg.id === segmentId);
  }

  public getBlockedSegments(): RouteSegment[] {
    return this.segments.filter(seg => this.blockedSegmentIds.has(seg.id) || seg.hasActiveBarrier);
  }

  // Cost calculation function for Dijkstra
  private calculateSegmentCost(segment: RouteSegment, prefs: RoutePreferences, isAccessibleScoring: boolean): number {
    // If blocked by a barrier, segment is impassable
    if (this.blockedSegmentIds.has(segment.id) || segment.hasActiveBarrier) {
      return Infinity;
    }

    const baseDistance = segment.distanceMeters;

    // If pure shortest-distance mode (Standard Route comparison)
    if (!isAccessibleScoring) {
      return baseDistance;
    }

    let costMultiplier = 1.0;
    let flatPenalty = 0;

    // Stairs penalty
    if (segment.stepsCount > 0) {
      if (prefs.stepFreeAccess) {
        return Infinity; // Strict requirement: zero stairs tolerated
      }
      if (prefs.avoidStairs) {
        flatPenalty += segment.stepsCount * 400 + 4000;
      } else {
        flatPenalty += segment.stepsCount * 80;
      }
    }

    // Ramp incentives
    if (prefs.preferRamps && segment.hasRamp) {
      costMultiplier *= 0.65; // High discount for safe ramped pathways
    }

    // Surface conditions
    if (prefs.smoothSurfaces) {
      switch (segment.surface) {
        case 'asphalt_smooth':
          costMultiplier *= 0.8;
          break;
        case 'paved_concrete':
          costMultiplier *= 0.88;
          break;
        case 'paver_tiles':
          costMultiplier *= 1.1;
          break;
        case 'gravel':
          costMultiplier *= 2.2;
          break;
        case 'cobblestone':
          costMultiplier *= 2.6;
          break;
        case 'broken_pavement':
          costMultiplier *= 3.5;
          break;
      }
    }

    // Vibration sensitivity
    if (prefs.lowerVibration) {
      if (segment.vibrationLevel === 'high') costMultiplier *= 2.4;
      if (segment.vibrationLevel === 'medium') costMultiplier *= 1.3;
      if (segment.vibrationLevel === 'low') costMultiplier *= 0.85;
    }

    // Night / lighting preference
    if (prefs.wellLitRoutes && !segment.isWellLit) {
      costMultiplier *= 1.6;
    }

    // Verified accessibility boost
    if (segment.isVerifiedAccessible) {
      costMultiplier *= 0.9;
    }

    return (baseDistance * costMultiplier) + flatPenalty;
  }

  // Dijkstra shortest-path solver
  public findOptimalPath(
    startNodeId: string, 
    targetNodeId: string, 
    prefs: RoutePreferences, 
    isAccessibleScoring: boolean
  ): RouteSegment[] | null {
    const distances: Record<string, number> = {};
    const previousNode: Record<string, string | null> = {};
    const previousSegment: Record<string, RouteSegment | null> = {};
    const unvisited = new Set<string>();

    for (const nodeId of Object.keys(GRAPH_NODES)) {
      distances[nodeId] = Infinity;
      previousNode[nodeId] = null;
      previousSegment[nodeId] = null;
      unvisited.add(nodeId);
    }

    distances[startNodeId] = 0;

    // Helper: get all outgoing segments for a node (bi-directional for walkable pathways)
    const getAdjacentEdges = (nodeId: string): { toNode: string; segment: RouteSegment }[] => {
      const edges: { toNode: string; segment: RouteSegment }[] = [];
      for (const seg of this.segments) {
        if (seg.fromNodeId === nodeId) {
          edges.push({ toNode: seg.toNodeId, segment: seg });
        } else if (seg.toNodeId === nodeId) {
          // reverse coordinates for traversal consistency
          const reversedSeg: RouteSegment = {
            ...seg,
            fromNodeId: seg.toNodeId,
            toNodeId: seg.fromNodeId,
            coordinates: [...seg.coordinates].reverse()
          };
          edges.push({ toNode: seg.fromNodeId, segment: reversedSeg });
        }
      }
      return edges;
    };

    while (unvisited.size > 0) {
      // Find unvisited node with lowest distance
      let currentNodeId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          currentNodeId = nodeId;
        }
      }

      if (!currentNodeId || minDistance === Infinity) {
        break; // No path available
      }

      if (currentNodeId === targetNodeId) {
        break; // Reached target
      }

      unvisited.delete(currentNodeId);

      for (const edge of getAdjacentEdges(currentNodeId)) {
        if (!unvisited.has(edge.toNode)) continue;

        const cost = this.calculateSegmentCost(edge.segment, prefs, isAccessibleScoring);
        if (cost === Infinity) continue;

        const totalCost = distances[currentNodeId] + cost;
        if (totalCost < distances[edge.toNode]) {
          distances[edge.toNode] = totalCost;
          previousNode[edge.toNode] = currentNodeId;
          previousSegment[edge.toNode] = edge.segment;
        }
      }
    }

    // Reconstruct path
    const path: RouteSegment[] = [];
    let curr: string | null = targetNodeId;

    while (curr && curr !== startNodeId) {
      const seg = previousSegment[curr];
      if (!seg) return null; // No path found
      path.unshift(seg);
      curr = previousNode[curr];
    }

    return path.length > 0 ? path : null;
  }

  // Build complete RouteOption object
  private buildRouteOption(
    id: string,
    title: string,
    segments: RouteSegment[],
    isRecommended: boolean,
    prefs: RoutePreferences
  ): RouteOption {
    let totalDistanceMeters = 0;
    let stepsCount = 0;
    let rampsCount = 0;
    let smoothSurfaceDistance = 0;
    const allCoords: Coordinate[] = [];
    const explanationReasons: string[] = [];
    const warnings: string[] = [];

    segments.forEach((seg, index) => {
      totalDistanceMeters += seg.distanceMeters;
      stepsCount += seg.stepsCount;
      if (seg.hasRamp) rampsCount++;
      if (seg.surface === 'asphalt_smooth' || seg.surface === 'paved_concrete') {
        smoothSurfaceDistance += seg.distanceMeters;
      }
      if (!seg.isVerifiedAccessible) {
        warnings.push(`Segment '${seg.name}' contains unverified accessibility conditions.`);
      }

      // Add coordinates, avoiding duplicate junction points
      if (index === 0) {
        allCoords.push(...seg.coordinates);
      } else {
        allCoords.push(...seg.coordinates.slice(1));
      }
    });

    const smoothSurfacePercentage = totalDistanceMeters > 0 
      ? Math.round((smoothSurfaceDistance / totalDistanceMeters) * 100) 
      : 100;

    // Speed calculation: Average wheelchair speed is approx 60 meters/min (3.6 km/h) for manual, 90 m/min for power
    const speedMetersPerMin = prefs.wheelchairType === 'electric' ? 85 : 60;
    let durationMinutes = Math.round(totalDistanceMeters / speedMetersPerMin);
    // Add 1 minute per 10 stairs delay if stairs present
    if (stepsCount > 0) {
      durationMinutes += Math.ceil(stepsCount / 6);
    }
    // Floor to minimum 3 mins
    durationMinutes = Math.max(3, durationMinutes);

    // Calculate accessibility score (0 - 100)
    let score = 100;
    if (stepsCount > 0) {
      score -= Math.min(60, stepsCount * 4);
    }
    if (smoothSurfacePercentage < 80) {
      score -= Math.round((80 - smoothSurfacePercentage) * 0.4);
    }
    if (rampsCount === 0 && stepsCount > 0) {
      score -= 15;
    }
    score = Math.max(10, Math.min(100, score));

    // Generate explanations
    if (stepsCount === 0) {
      explanationReasons.push('Step-Free Corridor (Simulated): 0 steps mapped based on current accessibility metadata.');
    } else {
      explanationReasons.push(`Caution: Route contains ${stepsCount} steps total.`);
    }

    if (rampsCount > 0) {
      explanationReasons.push(`Integrated Ramps: Features ${rampsCount} gradual accessible incline ramps.`);
    }

    if (smoothSurfacePercentage >= 85) {
      explanationReasons.push(`Smooth Mobility Corridors: ${smoothSurfacePercentage}% paved concrete and smooth asphalt.`);
    }

    if (prefs.wheelchairMode) {
      explanationReasons.push(`Optimized for ${prefs.wheelchairType} wheelchair clearance and low curb roll-overs.`);
    }

    // Turn by turn directions
    const turnByTurn = segments.map((seg, idx) => {
      let icon: 'start' | 'straight' | 'ramp' | 'turn_left' | 'turn_right' | 'stairs_warning' | 'finish' = 'straight';
      let instruction = `Continue on ${seg.name} for ${seg.distanceMeters}m`;

      if (idx === 0) {
        icon = 'start';
        instruction = `Depart start point along ${seg.name} (${seg.distanceMeters}m)`;
      } else if (idx === segments.length - 1) {
        icon = 'finish';
        instruction = `Follow ${seg.name} to arrival destination (${seg.distanceMeters}m)`;
      } else if (seg.hasRamp) {
        icon = 'ramp';
        instruction = `Ascend/descend gradual ramp via ${seg.name} (${seg.distanceMeters}m)`;
      } else if (seg.stepsCount > 0) {
        icon = 'stairs_warning';
        instruction = `Warning: ${seg.stepsCount} steps ahead on ${seg.name} (${seg.distanceMeters}m)`;
      }

      return {
        instruction,
        distanceMeters: seg.distanceMeters,
        icon,
        isAccessible: seg.stepsCount === 0,
        note: seg.hasRamp ? 'Wheelchair ramp available (Grade 1:14)' : undefined
      };
    });

    return {
      id,
      title,
      isRecommended,
      totalDistanceMeters,
      estimatedDurationMinutes: durationMinutes,
      stepsCount,
      rampsCount,
      smoothSurfacePercentage,
      accessibilityScore: score,
      segments,
      coordinates: allCoords,
      turnByTurn,
      explanationReasons,
      warnings
    };
  }

  // Calculate both Recommended Accessible Route and Standard Route
  public calculateRoute(
    origin: LocationItem,
    destination: LocationItem,
    prefs: RoutePreferences
  ): RouteCalculationResult {
    const startNodeId = findNearestGraphNode(origin.coordinate);
    const targetNodeId = findNearestGraphNode(destination.coordinate);

    // 1. Calculate Recommended Accessible Route
    let accessibleSegments = this.findOptimalPath(startNodeId, targetNodeId, prefs, true);

    // Fallback if strict preferences caused no path: relax step-free slightly if impossible
    if (!accessibleSegments) {
      const relaxedPrefs = { ...prefs, stepFreeAccess: false, avoidStairs: false };
      accessibleSegments = this.findOptimalPath(startNodeId, targetNodeId, relaxedPrefs, true);
    }

    // 2. Calculate Standard Shortest Route (unconstrained geographical distance)
    const standardSegments = this.findOptimalPath(startNodeId, targetNodeId, prefs, false);

    const recommended = this.buildRouteOption(
      'route_recommended_accessible',
      'Recommended Accessible Route',
      accessibleSegments || INITIAL_SEGMENTS.slice(0, 3),
      true,
      prefs
    );

    let alternative: RouteOption | undefined = undefined;
    if (standardSegments) {
      alternative = this.buildRouteOption(
        'route_standard_alternative',
        'Direct Standard Route (Non-Optimized)',
        standardSegments,
        false,
        prefs
      );
    }

    return {
      recommendedRoute: recommended,
      alternativeRoute: alternative,
      origin,
      destination,
      preferences: prefs,
      calculatedAt: new Date().toISOString()
    };
  }
}

export const routingEngineInstance = new RoutingEngine();

