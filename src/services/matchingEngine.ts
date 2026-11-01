import { RescueProvider, RescueRequest, RescueServiceType } from '../types/rescue';
import { INITIAL_RESCUE_PROVIDERS } from '../data/rescueProviders';
import { Coordinate } from '../types/navigation';
import { calculateHaversineDistance } from './routingEngine';

export interface ProviderMatchScore {
  provider: RescueProvider;
  totalScore: number; // 0 - 100
  serviceMatch: boolean;
  hoistMatch: boolean;
  distanceKm: number;
  etaMinutes: number;
  matchReasons: string[];
}

export class MatchingEngine {
  private providers: RescueProvider[];

  constructor(customProviders?: RescueProvider[]) {
    this.providers = customProviders ? [...customProviders] : [...INITIAL_RESCUE_PROVIDERS];
  }

  public getProviders(): RescueProvider[] {
    return this.providers;
  }

  // Calculate dynamic distance and arrival time from a breakdown location
  public recalculateDistances(userCoord: Coordinate): void {
    this.providers = this.providers.map(p => {
      const distanceMeters = calculateHaversineDistance(userCoord, p.coordinate);
      const distanceKm = Math.max(0.5, Number((distanceMeters / 1000).toFixed(1)));
      // Realistic urban emergency vehicle speed: ~25 km/h + 3 min prep
      const etaMinutes = Math.max(5, Math.round((distanceKm / 25) * 60 + 3));
      return {
        ...p,
        distanceKm,
        estimatedArrivalMinutes: etaMinutes
      };
    });
  }

  // Find & score providers based on request criteria
  public matchProviders(request: Partial<RescueRequest>, requireHoistFilter = false): ProviderMatchScore[] {
    const serviceType = request.serviceType || 'flat_tyre';
    const hoistRequired = request.hasWheelchairHoistRequired || requireHoistFilter;

    const scoredList: ProviderMatchScore[] = this.providers.map(provider => {
      let score = 50;
      const matchReasons: string[] = [];

      // 1. Service Type Compatibility (Essential)
      const hasService = provider.services.includes(serviceType);
      if (hasService) {
        score += 25;
        matchReasons.push(`Equipped for ${getServiceLabel(serviceType)}.`);
      } else {
        score -= 30;
      }

      // 2. Wheelchair Hoist / WAV Lift Compatibility
      let hoistMatch = true;
      if (hoistRequired) {
        if (provider.hasWheelchairHoistLift) {
          score += 20;
          matchReasons.push('Certified hydraulic wheelchair lift onboard.');
        } else {
          hoistMatch = false;
          score -= 40; // Heavy penalty if user explicitly needs wheelchair lift
        }
      }

      // 3. Proximity / Distance
      if (provider.distanceKm <= 3.0) {
        score += 15;
        matchReasons.push(`Nearby unit (${provider.distanceKm} km away, ETA ~${provider.estimatedArrivalMinutes}m).`);
      } else if (provider.distanceKm <= 6.0) {
        score += 5;
      } else {
        score -= 10;
      }

      // 4. Partner Verification & Mobility Certification
      if (provider.isMobilityCertified) {
        score += 10;
        matchReasons.push('Certified Accessible Roadside Responder.');
      }
      if (provider.isVerifiedPartner) {
        score += 5;
      }

      // Rating bonus
      score += Math.round((provider.rating - 4.0) * 10);

      const boundedScore = Math.max(10, Math.min(99, score));

      return {
        provider,
        totalScore: boundedScore,
        serviceMatch: hasService,
        hoistMatch,
        distanceKm: provider.distanceKm,
        etaMinutes: provider.estimatedArrivalMinutes,
        matchReasons
      };
    });

    // If hoist is strictly required, filter out providers without it, otherwise sort by score
    let results = scoredList;
    if (hoistRequired) {
      const strictList = scoredList.filter(item => item.provider.hasWheelchairHoistLift);
      if (strictList.length > 0) {
        results = strictList;
      }
    }

    // Sort descending by totalScore
    return results.sort((a, b) => b.totalScore - a.totalScore);
  }
}

export function getServiceLabel(type: RescueServiceType): string {
  switch (type) {
    case 'flat_tyre': return 'Flat Tyre / Puncture Repair';
    case 'battery_jump': return 'Battery Jump-Start & Boost';
    case 'towing': return 'Flatbed Towing & Recovery';
    case 'basic_repair': return 'Basic Roadside Vehicle Repair';
    case 'wav_assistance': return 'Wheelchair-Accessible Vehicle (WAV) & Hoist Support';
  }
}

export const matchingEngineInstance = new MatchingEngine();

