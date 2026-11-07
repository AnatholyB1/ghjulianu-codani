import 'server-only';
import { getAdminClient } from './supabaseAdmin';

export interface Pair { cur: number; prev: number }
export interface RankedPhoto { photo_id: string; count: number; src: string | null; alt: string | null; album_title: string | null }
export interface KpiData {
  range: { start: string; end: string; prev_start: string; prev_end: string; days: number };
  has_data: boolean;
  totals: {
    views: Pair; downloads: Pair; requests: Pair; bytes: Pair; visitor_days: Pair;
    signups: Pair & { confirmed: number };
  };
  subscribers: { now: number; base: number; gained: number; lost: number };
  daily: { day: string; views: number; downloads: number }[];
  sub_series: { day: string; total: number }[];
  funnel: { visitor_days: number; requests: number; links_opened: number; downloaded: number };
  top_favorites: RankedPhoto[];
  top_downloads: RankedPhoto[];
  top_albums: { album_id: string; title: string | null; is_public: boolean; views: number; downloads: number }[];
  day_night: { day: number; night: number };
  devices: { mobile: number; tablet: number; desktop: number };
}

export type KpiResult = { ok: true; data: KpiData } | { ok: false; detail: string };

/** One round trip to the kpi_dashboard SQL function (service role only). Never throws. */
export async function fetchKpis(days: 7 | 30 | 90): Promise<KpiResult> {
  try {
    const { data, error } = await getAdminClient().rpc('kpi_dashboard', { p_days: days });
    if (error) return { ok: false, detail: `rpc kpi_dashboard : ${error.code ?? 'erreur'}` };
    if (!data) return { ok: false, detail: 'rpc kpi_dashboard : réponse vide' };
    return { ok: true, data: data as KpiData };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message.slice(0, 120) : 'erreur inconnue' };
  }
}
