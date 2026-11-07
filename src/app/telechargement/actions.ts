'use server';

import { createElement } from 'react';
import { cookies, headers } from 'next/headers';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { hit, hashIdentifier } from '@/lib/server/rateLimit';
import { newToken, hashToken } from '@/lib/server/tokens';
import { sendEmail } from '@/lib/server/email/send';
import { siteUrl } from '@/lib/server/email/layout';
import DownloadLinkEmail, { downloadEmailSubject, downloadEmailText } from '@/lib/server/email/templates/DownloadLinkEmail';
import { logEvent, safeVisitorHash, deviceClass, countryOf } from '@/lib/server/events';
import { enqueueConfirmation } from '@/lib/server/newsletter';
import {
  GLOBAL_EMAIL_KEY, GLOBAL_EMAIL_WINDOW_SECONDS, IP_DAILY_WINDOW_SECONDS, downloadIpDailyCap, LIMITS, LINK_TTL_HOURS, downloadEmailDailyCap, checkFormToken, normalizeEmail, parsePhotoRefs, signFormToken, verifyAlbumAccess,
  type PhotoRef,
} from '@/lib/server/requestGuards';

/**
 * Behaviour contract (06-DESIGN-CONTRACT section 7).
 * `album_locked` is an additive code: a private-album cookie is missing/expired. It reveals nothing
 * about any email address, it only tells the visitor to enter the album key again.
 */
export type RequestResult =
  | { ok: true }
  | { ok: false; code: 'invalid_email' | 'rate_limited' | 'server_error' | 'album_locked' }
  | { ok: false; code: 'service_unavailable'; support: string | null };

export interface RequestInput {
  email: string;
  lang: string;
  newsletter: boolean;
  /** honeypot: must stay empty */
  website: string;
  formToken: string;
  /** cart snapshot: ids only, never URLs */
  photos: { photoId: string; source: string }[];
}

/** Generic success is padded to this floor so silent/ignored paths are not distinguishable by timing. */
const GENERIC_MIN_MS = 1800;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clientIp(h: Headers): string {
  const xff = h.get('x-forwarded-for');
  return (xff?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || 'unknown';
}

/** Signed render timestamp; the form fetches it when it opens (min time-to-submit check). */
export async function issueFormToken(): Promise<string | null> {
  try {
    return signFormToken();
  } catch (e) {
    console.warn('[request] form token failure:', e instanceof Error ? e.message : 'unknown');
    return null;
  }
}

export async function requestDownload(input: RequestInput): Promise<RequestResult> {
  const t0 = Date.now();
  const generic = async (): Promise<RequestResult> => {
    const wait = GENERIC_MIN_MS - (Date.now() - t0);
    if (wait > 0) await sleep(wait);
    return { ok: true };
  };

  try {
    if (!input || typeof input !== 'object') return { ok: false, code: 'server_error' };

    // 1. honeypot -> silent
    if (typeof input.website === 'string' && input.website.trim() !== '') return generic();

    // 2. signed render timestamp. ONLY the honeypot and "too fast" (< 2 s) are silent (padded to the
    //    same latency as a real success). A missing / forged / expired token, or a missing
    //    DOWNLOAD_TOKEN_SECRET (checkFormToken throws -> catch below), is a visible server_error so a
    //    broken deploy cannot masquerade as success.
    const tokenState = checkFormToken(input.formToken);
    if (tokenState === 'too_fast') return generic();
    if (tokenState !== 'ok') return { ok: false, code: 'server_error' };

    // 3a. rate limit per hashed IP -> visible `rate_limited` (contract)
    const h = await headers();
    const ipHash = hashIdentifier(clientIp(h));
    if (!(await hit(`dlreq:ip:${ipHash}`, LIMITS.ipPerHour.limit, LIMITS.ipPerHour.windowSeconds))) {
      return { ok: false, code: 'rate_limited' };
    }

    // 4. validate email (after the IP limiter so the validator cannot be probed for free)
    const email = normalizeEmail(input.email);
    if (!email) return { ok: false, code: 'invalid_email' };

    // 5. resolve photos FROM THE DB (never trust client URLs)
    const refs = parsePhotoRefs(input.photos);
    if (!refs) return { ok: false, code: 'server_error' };
    const lang: 'fr' | 'en' = input.lang === 'en' ? 'en' : 'fr';
    const db = getAdminClient();

    const albumIds = refs.filter((r) => r.source === 'album_photos').map((r) => r.photoId);
    const portfolioIds = refs.filter((r) => r.source === 'portfolio_photos').map((r) => r.photoId);

    const [albumRes, portfolioRes] = await Promise.all([
      albumIds.length
        ? db.from('album_photos').select('id, album_id').in('id', albumIds)
        : Promise.resolve({ data: [] as { id: string; album_id: string }[], error: null }),
      portfolioIds.length
        ? db.from('portfolio_photos').select('id').in('id', portfolioIds)
        : Promise.resolve({ data: [] as { id: string }[], error: null }),
    ]);
    if (albumRes.error || portfolioRes.error) {
      console.warn('[request] photo lookup failed');
      return { ok: false, code: 'server_error' };
    }

    const found: PhotoRef[] = [
      ...(albumRes.data ?? []).map((p) => ({ photoId: p.id, source: 'album_photos' as const })),
      ...(portfolioRes.data ?? []).map((p) => ({ photoId: p.id, source: 'portfolio_photos' as const })),
    ];
    if (found.length === 0) return { ok: false, code: 'server_error' };

    // 6. private-album check (signed cookie set by the key flow)
    const distinctAlbumIds = [...new Set((albumRes.data ?? []).map((p) => p.album_id))];
    let albumTitle: string | null = null;
    if (distinctAlbumIds.length) {
      const { data: albums, error } = await db
        .from('albums')
        .select('id, slug, title, is_public, access_key')
        .in('id', distinctAlbumIds);
      if (error || !albums || albums.length !== distinctAlbumIds.length) {
        return { ok: false, code: 'server_error' };
      }
      const jar = await cookies();
      for (const a of albums) {
        if (a.is_public) continue;
        if (!verifyAlbumAccess(jar.get(`album-access-${a.slug}`)?.value, a.slug, a.access_key)) {
          return { ok: false, code: 'album_locked' };
        }
      }
      if (albums.length === 1) albumTitle = albums[0].title;
    }

    // 6b. per-email bucket, consumed only now that the request is valid (a bad cart cannot burn a victim's quota) -> silent
    if (!(await hit(`dlreq:email:${hashIdentifier(email)}`, LIMITS.emailPerHour.limit, LIMITS.emailPerHour.windowSeconds))) {
      return generic();
    }

    // 6c. Daily caps on download emails (email-relay abuse).
    //     Per-IP daily cap first (default 20, well below the global cap) so one IP cannot exhaust the global
    //     budget alone; over it the user sees the visible `rate_limited` state.
    if (!(await hit(`dlreq:ipday:${ipHash}`, downloadIpDailyCap(), IP_DAILY_WINDOW_SECONDS))) {
      console.warn(`[request] per-IP daily download cap (${downloadIpDailyCap()}) reached for ip ${ipHash.slice(0, 8)}: request refused.`);
      return { ok: false, code: 'rate_limited' };
    }
    //     Over the GLOBAL cap: a visible, friendly error (never a fake success), nothing stored or sent, loud log.
    const cap = downloadEmailDailyCap();
    if (!(await hit(GLOBAL_EMAIL_KEY, cap, GLOBAL_EMAIL_WINDOW_SECONDS))) {
      console.error(`[request] GLOBAL DAILY DOWNLOAD-EMAIL CAP (${cap}) REACHED: request refused (service_unavailable shown to user), nothing sent. Possible abuse as email relay, or raise DOWNLOAD_EMAIL_DAILY_CAP.`);
      return { ok: false, code: 'service_unavailable', support: process.env.SUPPORT_EMAIL?.trim() || null };
    }

    const requestAlbumId = distinctAlbumIds.length === 1 && portfolioIds.length === 0 ? distinctAlbumIds[0] : null;

    // 7. insert the request (hash only; the raw token exists only in the email)
    const token = newToken();
    const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 3600 * 1000);
    const { data: row, error: insErr } = await db
      .from('download_requests')
      .insert({
        email,
        lang,
        token_hash: hashToken(token),
        expires_at: expiresAt.toISOString(),
        album_id: requestAlbumId,
        photos: found.map((p) => ({ photo_id: p.photoId, source: p.source })),
        ip_hash: ipHash,
        email_status: 'queued',
      })
      .select('id')
      .single();
    if (insErr || !row) {
      console.warn('[request] insert failed:', insErr?.code ?? 'no row');
      return { ok: false, code: 'server_error' };
    }

    // 8. optional newsletter: pending subscriber + consent proof. Never blocks or alters the download.
    if (input.newsletter === true) {
      try {
        // single implementation (phase 9): upserts the pending row with consent proof AND sends the double opt-in mail
        await enqueueConfirmation(email, lang);
      } catch (e) {
        console.warn('[request] newsletter step failed:', e instanceof Error ? e.message : 'unknown');
      }
    }

    // 9. the download email (transactional only, no marketing)
    const link = `${siteUrl()}/telechargement/${token}`;
    const props = {
      lang,
      link,
      photoCount: found.length,
      albumTitle,
      expiresLabel: new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short',
      }).format(expiresAt),
      siteUrl: siteUrl(),
      // LEGAL_POSTAL_ADDRESS is canonical; PUBLISHER_ADDRESS is a deprecated fallback.
      publisherAddress: process.env.LEGAL_POSTAL_ADDRESS?.trim() || process.env.PUBLISHER_ADDRESS?.trim() || null,
    };
    const sent = await sendEmail({
      to: email,
      subject: downloadEmailSubject(lang),
      react: createElement(DownloadLinkEmail, props),
      text: downloadEmailText(props),
      tags: [{ name: 'type', value: 'download_link' }],
    });
    const emailStatus = sent.sent ? 'sent' : sent.reason === 'guard' ? 'guarded' : 'failed';
    await db.from('download_requests').update({
      email_status: emailStatus,
      ...(emailStatus === 'failed' ? { revoked_at: new Date().toISOString() } : {}),
    }).eq('id', row.id);

    // 10. analytics (never throws)
    await logEvent({
      type: 'request',
      request_id: row.id,
      album_id: requestAlbumId,
      visitor_hash: safeVisitorHash({ headers: h }),
      device: deviceClass({ headers: h }),
      country: countryOf({ headers: h }),
    });

    if (emailStatus === 'failed') return { ok: false, code: 'server_error' };
    return generic();
  } catch (e) {
    console.warn('[request] unexpected failure:', e instanceof Error ? e.message : 'unknown');
    return { ok: false, code: 'server_error' };
  }
}
