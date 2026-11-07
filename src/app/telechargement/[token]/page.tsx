import type { Metadata } from 'next';
import { after } from 'next/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { getDeliveryState, loadDeliveryPhotos, planDelivery } from '@/lib/server/delivery';
import { isBot } from '@/lib/server/deliveryHttp';
import { hit } from '@/lib/server/rateLimit';
import { countryOf, deviceClass, logEvent, visitorHash } from '@/lib/server/events';
import Shell from './Shell';
import Terminal from './Terminal';
import DeliveryView, { type Tile } from './DeliveryView';
import { formatTime, formatWhen, type Lang } from './copy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vos photos',
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  referrer: 'no-referrer',
  openGraph: { title: 'Vos photos', images: [] },
  twitter: { card: 'summary', title: 'Vos photos', images: [] },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; e?: string }>;
};

async function reaskHref(albumId: string | null): Promise<string> {
  if (!albumId) return '/';
  const { data } = await getAdminClient().from('albums').select('slug, is_public').eq('id', albumId).maybeSingle();
  return data?.is_public && data.slug ? `/albums/${data.slug}` : '/';
}

export default async function DeliveryPage({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  const h = await headers();

  const state = await getDeliveryState(token); // throws on DB failure => error.tsx (500)
  if (state.status === 'invalid') notFound();

  const pick = (v?: string): Lang | null => (v === 'fr' || v === 'en' ? v : null);
  const lang: Lang = pick(sp.lang) ?? state.request.lang;
  const langHref = `/telechargement/${token}`;
  const req = state.request;

  if (state.status === 'expired' || state.status === 'exhausted') {
    return (
      <Shell lang={lang} langHref={langHref}>
        <Terminal kind={state.status} lang={lang} expiresAt={req.expiresAt} maxUses={req.maxUses} reaskHref={await reaskHref(req.albumId)} />
      </Shell>
    );
  }

  const { album, photos } = await loadDeliveryPhotos(req);
  if (!photos.length) throw new Error('delivery: request has no resolvable photos');
  const plan = await planDelivery(photos);

  // link_open: once per (request, visitor) per 30 min, never for bots/link previewers (not a use).
  const hdrs = new Headers([...h.entries()]);
  after(async () => {
    if (isBot({ headers: hdrs })) return;
    const vh = visitorHash({ headers: hdrs });
    if (!(await hit(`lo:${req.id}:${vh}`, 1, 1800))) return;
    await logEvent({
      type: 'link_open', request_id: req.id, album_id: req.albumId,
      device: deviceClass({ headers: hdrs }), country: countryOf({ headers: hdrs }), visitor_hash: vh,
    });
  });

  const tiles: Tile[] = plan.items.map((i) => ({
    id: i.row.id,
    url: i.source.url,
    w: i.row.width && i.row.width > 0 ? i.row.width : 1500,
    h: i.row.height && i.row.height > 0 ? i.row.height : 1000,
  }));

  return (
    <Shell lang={lang} langHref={langHref}>
      <DeliveryView
        token={token}
        lang={lang}
        albumTitle={album.title ?? 'Portfolio'}
        count={plan.items.length}
        totalBytes={plan.totalBytes}
        approx={!plan.allSizesKnown}
        usesLeft={Math.max(0, req.maxUses - req.usedCount)}
        maxUses={req.maxUses}
        windowOpen={state.windowEndsAt !== null}
        validUntil={formatWhen(req.expiresAt, lang)}
        windowUntil={state.windowEndsAt ? formatTime(state.windowEndsAt, lang) : null}
        parts={plan.parts.map((p) => ({ index: p.index, first: p.start + 1, last: p.start + p.items.length, bytes: p.bytes }))}
        tiles={tiles}
        error={sp.e === 'rate' ? 'rate' : sp.e === 'error' ? 'error' : null}
      />
    </Shell>
  );
}
