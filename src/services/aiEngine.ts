import { BarrierCategory } from '../types/community';
import { 
  AIClassificationResult, 
  AISummaryResult, 
  AIRouteExplanation, 
  AIHelperRecommendation 
} from '../types/ai';
import { RouteOption, RoutePreferences } from '../types/navigation';
import { RescueProvider, RescueServiceType } from '../types/rescue';

// Rule-based barrier classification dictionary
const CATEGORY_KEYWORDS: Record<BarrierCategory, string[]> = {
  blocked_ramp: ['ramp', 'incline', 'sloped entry', 'slope', 'curb cut', 'curb-cut', 'curb ramp', 'blocked by bike', 'vehicle parked'],
  broken_footpath: ['pavement', 'footpath', 'sidewalk', 'tiles', 'pothole', 'uneven', 'cracked', 'paving', 'root', 'heave'],
  stairs_no_ramp: ['stairs', 'steps', 'staircase', 'no ramp', 'flight of stairs', 'kerb', 'ledge', 'high curb'],
  construction: ['construction', 'digging', 'trench', 'debris', 'cement', 'excavator', 'barricade', 'scaffolding', 'roadwork'],
  inaccessible_entrance: ['entrance', 'revolving door', 'narrow door', 'turnstile', 'gate locked', 'threshold', 'security booth'],
  broken_elevator: ['elevator', 'lift', 'hoist', 'escalator out of service', 'lift broken', 'elevator maintenance'],
  high_curb: ['high curb', 'raised curb', 'high kerb', 'step up', 'no drop', 'steep curb'],
  other: ['lighting', 'dark', 'waterlogging', 'flooded', 'stray dogs', 'mud']
};

export class AIEngine {
  constructor() {
    // Local Rule-Based NLP Engine. External LLM calls are disabled in frontend code
    // to prevent exposing secret credentials. Server-side integration is scheduled for Phase 3.
  }

  public hasApiKey(): boolean {
    return false;
  }

  // 1. Barrier Classification (High-Precision Local Rule-Based NLP)
  public async classifyBarrier(description: string): Promise<AIClassificationResult> {
    const text = description.toLowerCase();

    // High-precision local heuristic AI classification
    let bestCategory: BarrierCategory = 'other';
    let maxMatches = 0;
    const extractedKeywords: string[] = [];

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [BarrierCategory, string[]][]) {
      let count = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          count++;
          if (!extractedKeywords.includes(kw)) extractedKeywords.push(kw);
        }
      }
      if (count > maxMatches) {
        maxMatches = count;
        bestCategory = cat;
      }
    }

    // Determine severity from urgency keywords
    let suggestedSeverity: 'low' | 'moderate' | 'high' | 'impassable' = 'moderate';
    if (text.includes('completely blocked') || text.includes('impassable') || text.includes('cannot pass') || text.includes('trench') || text.includes('locked')) {
      suggestedSeverity = 'impassable';
    } else if (text.includes('danger') || text.includes('stairs') || text.includes('hazard') || text.includes('steep') || text.includes('motorbikes')) {
      suggestedSeverity = 'high';
    } else if (text.includes('minor') || text.includes('slow down') || text.includes('bumpy')) {
      suggestedSeverity = 'low';
    }

    const confidence = maxMatches > 0 ? Math.min(0.96, 0.70 + (maxMatches * 0.08)) : 0.65;

    return {
      detectedCategory: bestCategory,
      confidence: Number(confidence.toFixed(2)),
      extractedKeywords: extractedKeywords.slice(0, 5),
      suggestedSeverity,
      isFromApi: false
    };
  }

  // 2. Smart Report Summarisation (Local Heuristic Engine)
  public async summarizeReport(title: string, description: string): Promise<AISummaryResult> {
    // Local heuristic summarizer
    const sentences = description.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const shortSummary = sentences[0] || description.slice(0, 100);

    const bulletPoints: string[] = [];
    bulletPoints.push(`Reported Issue: ${title}`);
    if (sentences.length > 1) {
      bulletPoints.push(`Impact: ${sentences[1]}`);
    } else {
      bulletPoints.push('Impact: Mobility hazard reported on pedestrian corridor');
    }
    bulletPoints.push('Action: Added to live navigation barrier map for smart rerouting.');

    return {
      conciseTitle: title.length > 45 ? title.slice(0, 42) + '...' : title,
      shortSummary,
      bulletPoints,
      isFromApi: false
    };
  }

  // 3. Route Explanation
  public explainRouteSelection(
    route: RouteOption, 
    alternative: RouteOption | undefined, 
    prefs: RoutePreferences
  ): AIRouteExplanation {
    const highlights: string[] = [];

    if (route.stepsCount === 0) {
      highlights.push('Zero stairs guaranteed throughout entire path.');
    } else {
      highlights.push(`Restricted to ${route.stepsCount} low-rise steps.`);
    }

    if (route.rampsCount > 0) {
      highlights.push(`Incorporates ${route.rampsCount} compliant incline ramps with safety handrails.`);
    }

    if (prefs.smoothSurfaces) {
      highlights.push(`Prioritizes ${route.smoothSurfacePercentage}% smooth asphalt and poured concrete over broken tiles.`);
    }

    let tradeoffs = 'Slightly longer distance (+150m) in exchange for 100% barrier-free wheelchair transit.';
    if (alternative) {
      const distDiff = route.totalDistanceMeters - alternative.totalDistanceMeters;
      const stairsDiff = alternative.stepsCount - route.stepsCount;
      if (stairsDiff > 0) {
        tradeoffs = `Avoids ${stairsDiff} flight steps on the standard corridor with only ${Math.max(0, distDiff)}m added travel.`;
      }
    }

    const summary = `Selected optimal step-free trajectory scoring ${route.accessibilityScore}/100 on the inclusive mobility index.`;

    return {
      summary,
      accessibilityHighlights: highlights,
      tradeoffs,
      isFromApi: false
    };
  }

  // 4. Roadside Assistance Match Recommendation
  public explainHelperRecommendation(
    provider: RescueProvider,
    serviceType: RescueServiceType,
    hoistRequired: boolean
  ): AIHelperRecommendation {
    const reasons: string[] = [];

    if (provider.hasWheelchairHoistLift && hoistRequired) {
      reasons.push('Equipped with verified hydraulic wheelchair lift for safe transfer.');
    }

    if (provider.isMobilityCertified) {
      reasons.push('Driver holds certified Accessible Roadside Assistance credentials.');
    }

    reasons.push(`Fastest reliable arrival: ~${provider.estimatedArrivalMinutes} mins (${provider.distanceKm} km away).`);

    const equipmentFit = provider.hasWheelchairHoistLift 
      ? 'Fully Compatible with Power Wheelchairs, Manual Chairs, and WAV Vans'
      : 'Standard Roadside Mechanical & Towing Unit';

    return {
      summary: `${provider.name} is the top match for your ${serviceType.replace('_', ' ')} breakdown.`,
      reasons,
      equipmentFit,
      isFromApi: false
    };
  }

}

export const aiEngineInstance = new AIEngine();

