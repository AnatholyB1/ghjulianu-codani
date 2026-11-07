'use client';

import Image   from 'next/image';
import Link    from 'next/link';
import {
  useEffect, useState, useCallback, useRef,
} from 'react';

import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { REQUEST_COPY } from '@/lib/requestCopy';
import RequestStep from '@/components/cart/RequestStep';
import '@/components/cart/request.css';

/* ── LEGACY direct download (removed in phase 8b; kept reachable as a secondary action) ── */
async function downloadPhoto(src: string, alt: string, downloadName?: string) {
  try {
    const res  = await fetch(src);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${(downloadName || alt || 'photo').replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download failed for', src, err);
  }
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

export default function CartDrawer() {
  const { items, remove, clear, open, setOpen, count } = useCart();
  const { lang } = useLang();
  const c = REQUEST_COPY[lang];

  const [step,          setStep]          = useState<'list' | 'form'>('list');
  const [footerNode,    setFooterNode]    = useState<React.ReactNode>(null);
  const [donationModal, setDonationModal] = useState(false);
  const [downloading,   setDownloading]   = useState(false);

  const fabRef    = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleRef  = useRef<HTMLHeadingElement>(null);
  const wasOpen   = useRef(false);

  const close = useCallback(() => { setOpen(false); setStep('list'); }, [setOpen]);

  /* Keyboard: Escape closes everything; Tab is trapped inside the open drawer */
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); setDonationModal(false); return; }
      if (e.key === 'Tab' && open && !donationModal && drawerRef.current) {
        const nodes = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
          .filter((n) => n.offsetParent !== null && !n.closest('[aria-hidden="true"]'));
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last  = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !drawerRef.current.contains(active))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (active === last || !drawerRef.current.contains(active))) { e.preventDefault(); first.focus(); }
      }
    },
    [close, open, donationModal],
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  /* Lock scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Focus: title on open, back to the cart button on close */
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const t = window.setTimeout(() => titleRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
    if (wasOpen.current) { wasOpen.current = false; fabRef.current?.focus(); }
  }, [open]);

  /* LEGACY (phase 8b removes) */
  async function handleDownloadAll() {
    setDonationModal(false);
    setDownloading(true);
    for (const photo of items) {
      await downloadPhoto(photo.src, photo.alt, photo.downloadName);
    }
    setDownloading(false);
    clear();
    close();
  }

  const goBack = useCallback(() => { setStep('list'); setFooterNode(null); }, []);
  const setFooter = useCallback((node: React.ReactNode) => setFooterNode(node), []);

  return (
    <>
      {/* ── Floating cart button (only visible when cart has items) ───── */}
      <button
        ref={fabRef}
        className="rq-fab"
        onClick={() => setOpen(true)}
        aria-label={c.openCart}
        aria-haspopup="dialog"
        aria-expanded={open}
        tabIndex={count > 0 ? 0 : -1}
        style={{
          position:       'fixed',
          bottom:         '5.5rem',
          right:          '1.8rem',
          zIndex:         150,
          width:          '52px',
          height:         '52px',
          borderRadius:   '50%',
          background:     'var(--text)',
          border:         'none',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 4px 24px rgba(0,0,0,0.55)',
          transition:     'transform 0.2s, opacity 0.3s',
          transform:      count > 0 ? 'scale(1)' : 'scale(0)',
          opacity:        count > 0 ? 1 : 0,
          pointerEvents:  count > 0 ? 'auto' : 'none',
        }}
        onMouseEnter={(e) => { if (count > 0) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { if (count > 0) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="9"  cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span
          data-testid="cart-count"
          style={{
            position:       'absolute',
            top:            '-5px',
            right:          '-5px',
            background:     'var(--accent)',
            color:          'var(--on-accent)',
            fontSize:       '0.75rem',
            fontFamily:     'var(--font-space)',
            fontWeight:     700,
            lineHeight:     1,
            minWidth:       '20px',
            height:         '20px',
            borderRadius:   '10px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '0 4px',
          }}
        >
          {count}
        </span>
      </button>

      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div className="rq-scrim" data-open={open} onClick={close} aria-hidden />

      {/* ── Drawer panel ──────────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        className="rq-drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rq-drawer-title"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="rq-head">
          <div>
            <p className="rq-eyebrow">{c.cartEyebrow}</p>
            <h2 id="rq-drawer-title" ref={titleRef} tabIndex={-1}>
              {step === 'form' ? c.title : c.cartTitle}
            </h2>
          </div>
          <button className="rq-iconbtn" onClick={close} aria-label={c.closeCart}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div className="rq-body">
          {step === 'form' && items.length > 0 ? (
            <RequestStep onBack={goBack} onClose={close} renderFooter={setFooter} />
          ) : items.length === 0 ? (
            <div className="rq-empty">
              <p>{c.empty}</p>
              <Link href="/albums" className="rq-btn rq-btn--ghost" onClick={close}>{c.browse}</Link>
            </div>
          ) : (
            <div className="rq-list">
              {items.map((photo) => (
                <div key={photo.id} className="rq-item">
                  <div className="rq-item__img">
                    <Image src={photo.src} alt="" width={72} height={54} unoptimized />
                  </div>
                  <div className="rq-item__t">
                    <p>{photo.alt || 'Photo'}</p>
                    {photo.context && <p>{photo.context}</p>}
                  </div>
                  <button
                    className="rq-iconbtn"
                    onClick={() => remove(photo.id)}
                    aria-label={`${c.remove} ${photo.alt || 'photo'}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: list entry point, or the request step's own primary button */}
        {items.length > 0 && step === 'list' && (
          <div className="rq-foot">
            <div className="rq-row">
              <p className="rq-hint" data-testid="cart-summary">{count === 1 ? c.countOne : c.countMany(count)}</p>
              <button className="rq-textbtn" onClick={clear}>{c.clear}</button>
            </div>
            <button className="rq-btn" data-testid="cta-request" onClick={() => setStep('form')}>{c.cta}</button>
            <p className="rq-hint">{c.ctaHint}</p>
            {/* LEGACY direct download: phase 8b removes this and the donation modal below */}
            <button
              className="rq-btn rq-btn--ghost"
              onClick={() => setDonationModal(true)}
              disabled={downloading}
              data-testid="legacy-download"
            >
              {downloading ? '…' : c.legacyDownload}
            </button>
          </div>
        )}
        {items.length > 0 && step === 'form' && <div className="rq-foot">{footerNode}</div>}
      </div>

      {/* ── Donation modal (LEGACY, phase 8b removes) ────────────────── */}
      {donationModal && (
        <div
          onClick={() => setDonationModal(false)}
          style={{
            position:       'fixed',
            inset:          0,
            zIndex:         300,
            background:     'rgba(0,0,0,0.88)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            animation:      'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              border:     '1px solid var(--border)',
              padding:    'clamp(2rem,5vw,3rem)',
              width:      'min(500px, 92vw)',
              textAlign:  'center',
              animation:  'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '1rem' }}>
              AVANT DE TÉLÉCHARGER
            </p>
            <h2
              style={{
                fontFamily:   'var(--font-cormorant),serif',
                fontSize:     'clamp(1.7rem,4vw,2.5rem)',
                fontStyle:    'italic',
                fontWeight:   300,
                color:        '#E8E4DC',
                lineHeight:   1.15,
                marginBottom: '1rem',
              }}
            >
              Ces images vous ont touché ?
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.9, maxWidth: '380px', margin: '0 auto 2rem' }}>
              Mon travail est librement accessible. Si vous souhaitez soutenir la création et me permettre de continuer à photographier, un geste — même modeste — est infiniment précieux.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <Link
                href="/don"
                onClick={() => setDonationModal(false)}
                style={{
                  display:       'block',
                  background:    'var(--accent)',
                  color:         '#080808',
                  padding:       '1.05rem',
                  fontSize:      '0.62rem',
                  letterSpacing: '0.2em',
                  fontFamily:    'var(--font-space)',
                  fontWeight:    700,
                  textDecoration: 'none',
                }}
              >
                SOUTENIR GHJULIANU →
              </Link>
              <button
                onClick={handleDownloadAll}
                style={{
                  background:    'none',
                  border:        '1px solid var(--border)',
                  color:         'var(--muted)',
                  padding:       '0.95rem',
                  fontSize:      '0.6rem',
                  letterSpacing: '0.16em',
                  cursor:        'pointer',
                }}
              >
                TÉLÉCHARGER QUAND MÊME
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
