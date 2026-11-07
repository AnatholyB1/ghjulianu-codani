'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Check, CircleMinus, Clock, Trash2 } from 'lucide-react';
import { deleteSubscriber } from './actions';

export interface SubRow {
  id: string;
  email: string;
  status: 'pending' | 'confirmed' | 'unsubscribed' | 'suppressed';
  lang: string;
  source: string;
  date: string;
  version: string;
  note: string | null;
}

const BADGE = {
  confirmed: { label: 'Confirmé', Icon: Check },
  pending: { label: 'En attente', Icon: Clock },
  unsubscribed: { label: 'Désinscrit', Icon: CircleMinus },
  suppressed: { label: 'Supprimé', Icon: Ban },
} as const;

const ERRORS: Record<string, string> = {
  unauthorized: 'Session expirée. Reconnectez-vous.',
  suppressed: 'Une adresse supprimée (rebond ou plainte) ne peut pas être effacée : elle empêche tout nouvel envoi.',
  not_found: 'Cet abonné n’existe plus.',
  invalid: 'Identifiant invalide.',
  server: 'La suppression a échoué. Réessayez.',
};

export default function SubscriberTable({ rows }: { rows: SubRow[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const delRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  function cancel(id: string) {
    setConfirming(null);
    setError(null);
    requestAnimationFrame(() => delRefs.current[id]?.focus());
  }

  function doDelete(row: SubRow) {
    setError(null);
    start(async () => {
      const res = await deleteSubscriber(row.id);
      if (!res.ok) {
        setError(ERRORS[res.error ?? 'server'] ?? ERRORS.server);
        return;
      }
      setRemoved((s) => new Set(s).add(row.id));
      setConfirming(null);
      setToast(`Abonné supprimé : ${row.email}`);
      router.refresh();
    });
  }

  const visible = rows.filter((r) => !removed.has(r.id));

  return (
    <>
      <table className="nl-subs">
        <caption className="sr-only">Abonnés à la newsletter</caption>
        <thead>
          <tr>
            <th scope="col">Email</th>
            <th scope="col">Statut</th>
            <th scope="col" className="col-lang">Langue</th>
            <th scope="col" className="col-src">Source</th>
            <th scope="col" className="col-date">Consentement</th>
            <th scope="col" className="col-ver">Texte</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const { label, Icon } = BADGE[r.status];
            if (confirming === r.id) {
              return (
                <tr key={r.id} className="confirm-row">
                  <td colSpan={7}>
                    <div
                      className="confirm-box"
                      role="alertdialog"
                      aria-labelledby={`cd-${r.id}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancel(r.id);
                      }}
                    >
                      <p id={`cd-${r.id}`}>
                        Supprimer définitivement <strong>{r.email}</strong> ? L’adresse sera effacée de l’abonnement, des demandes de
                        téléchargement et des événements. Cette action est irréversible.
                        {error ? <span className="nl-inline-err" role="alert"> {error}</span> : null}
                      </p>
                      <div className="btns">
                        <button ref={cancelRef} type="button" className="nl-btn ghost" onClick={() => cancel(r.id)} disabled={pending}>
                          Annuler
                        </button>
                        <button type="button" className="nl-btn danger" onClick={() => doDelete(r)} disabled={pending} aria-busy={pending}>
                          {pending ? 'Suppression…' : 'Supprimer définitivement'}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={r.id}>
                <td className="email">{r.email}</td>
                <td className="col-status">
                  <span className={`badge ${r.status}`}>
                    <Icon aria-hidden="true" strokeWidth={1.5} />
                    {label}
                  </span>
                  {r.note ? <span className="sub-note">{r.note}</span> : null}
                </td>
                <td className="muted col-lang">{r.lang}</td>
                <td className="muted col-src">{r.source}</td>
                <td className="muted col-date">
                  <span className="mlang">{r.lang} · </span>
                  {r.date}
                </td>
                <td className="muted col-ver">{r.version}</td>
                <td className="act">
                  {r.status === 'suppressed' ? (
                    <button type="button" className="del" disabled aria-label={`Supprimer ${r.email} : impossible`} title="Une adresse supprimée (rebond ou plainte) est conservée pour ne plus jamais lui écrire.">
                      <Trash2 aria-hidden="true" strokeWidth={1.25} />
                      <span>Conservé</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="del"
                      aria-label={`Supprimer ${r.email}`}
                      ref={(el) => {
                        delRefs.current[r.id] = el;
                      }}
                      onClick={() => {
                        setError(null);
                        setConfirming(r.id);
                      }}
                    >
                      <Trash2 aria-hidden="true" strokeWidth={1.25} />
                      <span>Supprimer</span>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.some((r) => r.status === 'suppressed') ? (
        <p className="nl-note" style={{ textAlign: 'left', marginTop: '.75rem' }}>
          Les adresses « Supprimées » (rebond définitif ou plainte) sont conservées volontairement : les effacer permettrait de leur réécrire.
        </p>
      ) : null}
      {toast ? (
        <div className="nl-toast" role="status">
          <span className="t">
            <Check aria-hidden="true" strokeWidth={1.5} />
            {toast}
          </span>
          <button type="button" onClick={() => setToast(null)}>Fermer</button>
        </div>
      ) : null}
    </>
  );
}
