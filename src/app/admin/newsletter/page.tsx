import Link from 'next/link';
import { AlertCircle, Download, Search, X } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { getAdminUser } from '@/lib/server/requireAdmin';
import SubscriberTable, { type SubRow } from './SubscriberTable';
import './newsletter-admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Newsletter — Admin' };

const PAGE_SIZE = 25;
const STATUSES = [
  { key: 'all', label: 'Tous' },
  { key: 'confirmed', label: 'Confirmés' },
  { key: 'pending', label: 'En attente' },
  { key: 'unsubscribed', label: 'Désinscrits' },
  { key: 'suppressed', label: 'Supprimés' },
] as const;
type StatusKey = (typeof STATUSES)[number]['key'];

const SOURCES: Record<string, string> = { download: 'Téléchargement', footer: 'Pied de page' };
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' });

function qs(params: Record<string, string | number | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== 'all' && v !== 1) u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : '';
}

export default async function NewsletterAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  // Defence in depth: src/proxy.ts already guards /admin/**; this page uses the service role.
  if (!(await getAdminUser())) redirect('/admin/login?redirect=/admin/newsletter');
  const sp = await searchParams;
  const status: StatusKey = STATUSES.some((s) => s.key === sp.status) ? (sp.status as StatusKey) : 'all';
  const q = (sp.q ?? '').trim().slice(0, 100);
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const db = getAdminClient();

  let loadError = false;
  const counts: Record<StatusKey, number> = { all: 0, confirmed: 0, pending: 0, unsubscribed: 0, suppressed: 0 };
  let rows: SubRow[] = [];
  let total = 0;

  try {
    const countQ = (s?: string) => {
      let b = db.from('subscribers').select('id', { count: 'exact', head: true });
      if (s) b = b.eq('status', s);
      return b;
    };
    const [all, confirmed, pending, unsub, supp] = await Promise.all([
      countQ(), countQ('confirmed'), countQ('pending'), countQ('unsubscribed'), countQ('suppressed'),
    ]);
    for (const r of [all, confirmed, pending, unsub, supp]) if (r.error) throw r.error;
    counts.all = all.count ?? 0;
    counts.confirmed = confirmed.count ?? 0;
    counts.pending = pending.count ?? 0;
    counts.unsubscribed = unsub.count ?? 0;
    counts.suppressed = supp.count ?? 0;

    let lq = db
      .from('subscribers')
      .select('id,email,status,lang,source,consent_at,consent_text_version,confirm_expires_at,unsubscribed_at,suppressed_reason,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (status !== 'all') lq = lq.eq('status', status);
    if (q) lq = lq.ilike('email', `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    const res = await lq;
    if (res.error) throw res.error;
    total = res.count ?? 0;
    const now = Date.now();
    rows = (res.data ?? []).map((r) => {
      let note: string | null = null;
      if (r.status === 'pending' && r.confirm_expires_at) {
        const h = Math.ceil((new Date(r.confirm_expires_at).getTime() - now) / 3_600_000);
        note = h > 0 ? `Expire dans ${h} h` : 'Lien expiré';
      } else if (r.status === 'suppressed') {
        note = r.suppressed_reason === 'complaint' ? 'Plainte spam' : 'Rebond définitif';
      } else if (r.status === 'unsubscribed' && r.unsubscribed_at) {
        note = `Désinscrit le ${dateFmt.format(new Date(r.unsubscribed_at))}`;
      }
      return {
        id: r.id as string,
        email: r.email as string,
        status: r.status as SubRow['status'],
        lang: String(r.lang ?? 'fr').toUpperCase(),
        source: SOURCES[r.source as string] ?? (r.source as string | null) ?? '—',
        date: dateFmt.format(new Date((r.consent_at ?? r.created_at) as string)),
        version: (r.consent_text_version as string | null) ?? '—',
        note,
      };
    });
  } catch (e) {
    console.error('[admin/newsletter] load failed:', e instanceof Error ? e.message : e);
    loadError = true;
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = status !== 'all' || q !== '';
  const statusLabel = STATUSES.find((s) => s.key === status)?.label ?? 'Tous';
  const noneAtAll = !loadError && counts.all === 0;

  return (
    <div className="nl-admin">
      <div className="nl-title">
        <div>
          <p className="nl-sub">Newsletter</p>
          <h1 className="nl-h1">Abonnés</h1>
        </div>
        <div>
          {counts.confirmed > 0 ? (
            <a className="nl-btn" href="/admin/newsletter/export" download>
              <Download aria-hidden="true" strokeWidth={1.25} />
              Exporter CSV ({counts.confirmed})
            </a>
          ) : (
            <button className="nl-btn" type="button" disabled aria-describedby="nl-xn">
              <Download aria-hidden="true" strokeWidth={1.25} />
              Exporter CSV (0)
            </button>
          )}
          <p className="nl-note" id="nl-xn">
            {counts.confirmed > 0
              ? 'Abonnés confirmés uniquement. Excel : UTF-8, séparateur point-virgule.'
              : 'Aucun abonné confirmé à exporter.'}
          </p>
        </div>
      </div>

      {loadError ? (
        <div className="nl-alert" role="alert">
          <AlertCircle aria-hidden="true" strokeWidth={1.5} />
          <span>Impossible de charger les abonnés. Réessayez.</span>
          <Link className="nl-btn ghost" href={`/admin/newsletter${qs({ status, q, page })}`}>Réessayer</Link>
        </div>
      ) : (
        <>
          <nav className="nl-filters" aria-label="Filtrer par statut">
            {STATUSES.map((s) => (
              <Link key={s.key} href={`/admin/newsletter${qs({ status: s.key, q })}`} aria-current={status === s.key ? 'true' : undefined}>
                <span className="n">{counts[s.key]}</span>
                <span className="l">{s.label}</span>
              </Link>
            ))}
          </nav>

          <form className="nl-search" role="search" aria-label="Rechercher un abonné" action="/admin/newsletter" method="get">
            {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
            <div className="nl-field">
              <label className="sr-only" htmlFor="nl-q">Rechercher une adresse email</label>
              <Search className="ico" aria-hidden="true" strokeWidth={1.5} />
              <input id="nl-q" type="search" name="q" placeholder="Rechercher une adresse email" defaultValue={q} autoComplete="off" />
              {q ? (
                <Link className="clear" href={`/admin/newsletter${qs({ status })}`} aria-label="Effacer la recherche">
                  <X aria-hidden="true" strokeWidth={1.5} />
                </Link>
              ) : null}
            </div>
            <span className="nl-count" role="status" aria-live="polite">
              {hasFilter ? `${total} résultat${total > 1 ? 's' : ''}` : ''}
            </span>
          </form>

          {noneAtAll ? (
            <div className="nl-empty">
              <h2>Aucun abonné pour l’instant</h2>
              <p>
                Les personnes qui cochent la case newsletter en demandant des photos apparaissent ici, d’abord « en attente »,
                puis « confirmé » dès qu’elles appuient sur le bouton de l’email.
              </p>
              <ol>
                <li>Un visiteur demande des photos et coche la case newsletter (facultative).</li>
                <li>Il reçoit un email de confirmation, valable 48 h.</li>
                <li>Il devient abonné quand il appuie sur le bouton.</li>
              </ol>
            </div>
          ) : rows.length === 0 ? (
            <div className="nl-empty">
              <h2>Aucun résultat</h2>
              <p>
                Aucun abonné ne correspond{q ? ` à « ${q} »` : ''} dans « {statusLabel} ».
              </p>
              <Link className="nl-btn ghost" href="/admin/newsletter">Effacer la recherche et le filtre</Link>
            </div>
          ) : (
            <SubscriberTable rows={rows} />
          )}

          {pages > 1 ? (
            <div className="nl-pager">
              <span className="nl-count">Page {page} sur {pages}</span>
              <div className="btns">
                {page > 1 ? <Link className="nl-btn ghost" href={`/admin/newsletter${qs({ status, q, page: page - 1 })}`}>Précédent</Link> : null}
                {page < pages ? <Link className="nl-btn ghost" href={`/admin/newsletter${qs({ status, q, page: page + 1 })}`}>Suivant</Link> : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
