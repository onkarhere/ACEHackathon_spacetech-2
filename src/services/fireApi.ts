import { FireObservation } from '../types/incident';
import { supabase, isSupabaseConfigured } from './supabase';
import { DEMO_INCIDENTS } from '../data/demoData';

export interface FireApiResponse {
  observations: FireObservation[];
  source: string;
  status: 'LIVE' | 'SAMPLE' | 'STALE' | 'ERROR';
  detection_count: number;
  last_updated: string;
  notes?: string;
}

export async function fetchFireObservations(
  incidentId: string,
  latitude: number,
  longitude: number
): Promise<FireApiResponse> {
  // Coordinate sanity check
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {
      observations: [],
      source: 'Invalid Coordinate Bounds',
      status: 'ERROR',
      detection_count: 0,
      last_updated: new Date().toISOString(),
      notes: 'Provided coordinates exceed geographic limits.',
    };
  }

  // 1. Try local secure server proxy (/api/firms) - hides API key on server side
  try {
    const res = await fetch(`/api/firms?latitude=${latitude}&longitude=${longitude}&days=2`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.observations) && json.observations.length > 0) {
        return {
          observations: json.observations.map((obs: any, idx: number) => ({
            id: `firms-live-${idx}`,
            incident_id: incidentId,
            latitude: Number(obs.latitude),
            longitude: Number(obs.longitude),
            brightness: obs.brightness ? Number(obs.brightness) : 340,
            frp: obs.frp ? Number(obs.frp) : 30,
            confidence: obs.confidence || 'nominal',
            observed_at: obs.observed_at || new Date().toISOString(),
            source: 'NASA FIRMS VIIRS_SNPP_NRT (2 day(s), ±1°)',
            is_simulated: false,
          })),
          source: 'NASA FIRMS VIIRS_SNPP_NRT (2 day(s), ±1°)',
          status: 'LIVE',
          detection_count: json.observations.length,
          last_updated: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Continue to next provider
  }

  // 2. Try Supabase Edge Function / Supabase Table if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('get-fire-observations', {
        body: { incidentId, latitude, longitude, radiusKm: 40 },
      });
      if (!error && Array.isArray(data?.observations) && data.observations.length > 0) {
        return {
          observations: data.observations.map((obs: any, idx: number) => ({
            id: obs.id || `firms-${idx}`,
            incident_id: incidentId,
            latitude: Number(obs.latitude),
            longitude: Number(obs.longitude),
            brightness: obs.brightness ? Number(obs.brightness) : 340,
            frp: obs.frp ? Number(obs.frp) : 50,
            confidence: obs.confidence || 'nominal',
            observed_at: obs.observed_at || new Date().toISOString(),
            source: 'NASA FIRMS VIIRS_SNPP_NRT (via Supabase Edge)',
            is_simulated: false,
          })),
          source: 'NASA FIRMS VIIRS_SNPP_NRT (via Supabase Edge)',
          status: 'LIVE',
          detection_count: data.observations.length,
          last_updated: new Date().toISOString(),
        };
      }
    } catch {
      // Graceful fallback
    }
  }

  // 3. Fallback to sample dataset
  const bundle = DEMO_INCIDENTS[incidentId] || DEMO_INCIDENTS['inc-kalimantan'] || DEMO_INCIDENTS['inc-creek-fire'];
  return {
    observations: bundle.hotspots,
    source: 'NASA FIRMS VIIRS_SNPP_NRT (2 day(s), ±1°)',
    status: 'SAMPLE',
    detection_count: bundle.hotspots.length,
    last_updated: new Date().toISOString(),
    notes: 'Operating in demonstration sample mode.',
  };
}
