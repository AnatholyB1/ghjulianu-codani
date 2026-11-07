import { after } from 'next/server';
import { consumeDownloadUse, loadDeliveryPhotos, planDelivery } from '@/lib/server/delivery';
import { photoFileName, zipFileName } from '@/lib/server/deliveryPlan';
import {
  PRIVATE_HEADERS,
  contentDisposition,
  gate,
  logDownloads,
  refuse,
  type DownloadRecord,
} from '@/lib/server/deliveryHttp';
import { fetchPhotoSource } from '@/lib/server/photoSource';
import { countingStream, zipReadableStream, type ZipEntry } from '@/lib/server/zipStream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // seconds; must be a literal (keep equal to DOWNLOAD_MAX_DURATION_SECONDS)

/**
 * Streamed ZIP (STORE mode) of one part of the request. Order:
 *  1. gate (token, rate limits, non-consuming state)
 *  2. plan parts (HEAD sizes, deterministic split) and validate `part`
 *  3. pre-flight: EVERY item of the requested part must have a known size (HEAD ok, one retry
 *     already done by planDelivery) before consuming; otherwise 502-style refusal, nothing consumed.
 *     Missing item policy: the part containing an unreachable photo cannot be downloaded (no use
 *     burned, no truncated archive); the other parts still work. Photos deleted from the DB are
 *     skipped at plan time; photos missing only from storage fail this check.
 *  4. consume_download_use (atomic; an open 15-minute session is reused, not re-charged)
 *  5. stream: files fetched one at a time, nothing buffered beyond one chunk
 * A failure after step 4 (a later file unavailable, client gone) truncates the
 * archive; the session stays open for 15 minutes so the visitor can retry free.
 */
/** HEAD: validates the token read-only and describes the response. NEVER consumes a use. */
export async function HEAD(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  try {
    const g = await gate(req, token);
    if (!g.ok) return g.response;
    const partParam = new URL(req.url).searchParams.get('part');
    const partNo = partParam === null ? 1 : Number(partParam);
    const { photos } = await loadDeliveryPhotos(g.request);
    if (!photos.length) return refuse(req, token, 'error');
    const plan = await planDelivery(photos);
    if (!Number.isInteger(partNo) || partNo < 1 || partNo > plan.parts.length) {
      return new Response(null, { status: 404, headers: PRIVATE_HEADERS });
    }
    const headers = new Headers(PRIVATE_HEADERS);
    headers.set('Content-Type', 'application/zip');
    headers.set('X-Zip-Part', `${partNo}/${plan.parts.length}`);
    return new Response(null, { status: 200, headers });
  } catch (e) {
    console.error('[download/zip] HEAD failure:', e instanceof Error ? e.message : 'unknown');
    return refuse(req, token, 'error');
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  try {
    const g = await gate(req, token);
    if (!g.ok) return g.response;

    const partParam = new URL(req.url).searchParams.get('part');
    const partNo = partParam === null ? 1 : Number(partParam);

    const { prefix, photos } = await loadDeliveryPhotos(g.request);
    if (!photos.length) return refuse(req, token, 'error');
    const plan = await planDelivery(photos);
    if (!Number.isInteger(partNo) || partNo < 1 || partNo > plan.parts.length) {
      return Response.json({ error: 'not_found', status: 404 }, { status: 404, headers: PRIVATE_HEADERS });
    }
    const part = plan.parts[partNo - 1];

    const abort = new AbortController();
    req.signal.addEventListener('abort', () => abort.abort(), { once: true });

    // Pre-flight: every file of this part must be reachable before a use is consumed.
    if (part.items.some((it) => !it.sizeKnown)) return refuse(req, token, 'error');

    const consumed = await consumeDownloadUse(token);
    if (!consumed) return refuse(req, token, 'exhausted');

    const records: DownloadRecord[] = [];
    const entries: ZipEntry[] = part.items.map((item) => ({
      name: photoFileName(prefix, item.n, item.source.ext),
      open: async (signal) => {
        const res = await fetchPhotoSource(item.source, signal);
        return countingStream(res.body!, (bytes) => {
          records.push({ photoId: item.row.id, bytes });
        });
      },
    }));

    let resolveDone!: () => void;
    const done = new Promise<void>((r) => (resolveDone = r));
    const zip = countingStream(zipReadableStream(entries, { signal: abort.signal }), (_bytes, completed) => {
      if (!completed) abort.abort();
      resolveDone();
    });

    after(async () => {
      await done;
      await logDownloads(
        req,
        { requestId: consumed.requestId, albumId: g.request.albumId, part: partNo },
        records,
      );
    });

    const headers = new Headers(PRIVATE_HEADERS);
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', contentDisposition(zipFileName(prefix, partNo, plan.parts.length)));
    headers.set('X-Download-Window-Open', consumed.windowOpen ? '1' : '0');
    headers.set('X-Download-Uses-Remaining', String(consumed.remaining));
    headers.set('X-Zip-Part', `${partNo}/${plan.parts.length}`);
    return new Response(zip, { status: 200, headers });
  } catch (e) {
    console.error('[download/zip] failure:', e instanceof Error ? e.message : 'unknown');
    return refuse(req, token, 'error');
  }
}
