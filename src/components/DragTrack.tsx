'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';

/* ─────────────────────────────────────────────────────────────
   DragTrack — Infinite brick-wall layout
   ─────────────────────────────────────────────────────────────
   • Columns grouping: portrait alone, landscapes 2–3 stacked
   • Two identical copies rendered side-by-side for seamless wrap
   • Input: mouse drag, touch drag, mouse wheel (any axis)
   • Momentum coasts after release; no auto-scroll
───────────────────────────────────────────────────────────── */

export type TrackPhoto = {
  src:    string;
  width:  number;
  height: number;
  alt?:   string;
};

interface Props {
  photos:       TrackPhoto[];
  onClickPhoto: (index: number) => void;
  trackHeight?: string;
}

/* ── Build brick columns ──────────────────────────────────── */
type Column = { indices: number[] };

function buildColumns(photos: TrackPhoto[]): Column[] {
  const cols: Column[] = [];
  let i = 0;
  while (i < photos.length) {
    const ratio       = photos[i].width / photos[i].height;
    const isLandscape = ratio >= 0.85;
    if (!isLandscape) {
      cols.push({ indices: [i] });
      i += 1;
    } else {
      let run = 1;
      while (run < 3 && i + run < photos.length) {
        const r2 = photos[i + run].width / photos[i + run].height;
        if (r2 >= 0.85) run++; else break;
      }
      if      (run >= 3) { cols.push({ indices: [i, i+1, i+2] }); i += 3; }
      else if (run >= 2) { cols.push({ indices: [i, i+1]       }); i += 2; }
      else               { cols.push({ indices: [i]             }); i += 1; }
    }
  }
  return cols;
}

/* ─────────────────────────────────────────────────────────── */
const FRICTION = 0.88; // momentum decay per frame
const MIN_VEL  = 0.1;  // px/frame below which motion stops
// wheel: pixels per unit of deltaY (line-mode ~16px, pixel-mode 1px)
const WHEEL_MULT = 1.2;

export default function DragTrack({
  photos,
  onClickPhoto,
  trackHeight = 'clamp(340px, 68vh, 680px)',
}: Props) {
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const railRef     = useRef<HTMLDivElement>(null);
  const setWidthRef = useRef(0);   // pixel width of ONE copy of columns

  // motion state in refs — no re-renders
  const dragging   = useRef(false);
  const hasDragged = useRef(false);
  const lastX      = useRef(0);
  const velocity   = useRef(0);    // px / frame (positive = rightward)
  const offsetX    = useRef(0);    // current translateX in px

  const columns = useMemo(() => buildColumns(photos), [photos]);

  /* ── measure one set's pixel width after mount ──────── */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    // two identical copies → each copy = half of scrollWidth
    const measure = () => { setWidthRef.current = rail.scrollWidth / 2; };
    measure();
    // re-measure on resize
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [columns]);

  /* ── rAF loop ───────────────────────────────────────── */
  useEffect(() => {
    let rafId: number;
    function tick() {
      const rail = railRef.current;
      if (!rail) { rafId = requestAnimationFrame(tick); return; }

      const sw = setWidthRef.current;
      if (!sw) { rafId = requestAnimationFrame(tick); return; }

      if (!dragging.current && Math.abs(velocity.current) > MIN_VEL) {
        velocity.current *= FRICTION;
        offsetX.current  += velocity.current;
      } else if (!dragging.current) {
        velocity.current = 0;
      }

      // seamless wrap
      if (offsetX.current < -sw)  offsetX.current += sw;
      if (offsetX.current >  0)   offsetX.current -= sw;

      rail.style.transform = `translateX(${offsetX.current}px)`;

      // per-image parallax: each image reveals a different crop
      // depending on where it currently sits in the viewport
      const vw = window.innerWidth;
      rail.querySelectorAll<HTMLElement>('.bw-img').forEach((img) => {
        const rect = img.getBoundingClientRect();
        const cx   = rect.left + rect.width / 2;
        // map 0..vw → 70%..30% (image enters from right showing its left side, exits left showing right)
        const pct  = Math.max(20, Math.min(80, 70 - (cx / vw) * 40));
        img.style.objectPosition = `${pct}% center`;
      });

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // intentionally empty — refs are stable

  /* ── drag handlers ──────────────────────────────────── */
  const onDown = useCallback((x: number) => {
    dragging.current   = true;
    hasDragged.current = false;
    lastX.current      = x;
    velocity.current   = 0;
    if (railRef.current) railRef.current.style.cursor = 'grabbing';
  }, []);

  const onMove = useCallback((x: number) => {
    if (!dragging.current) return;
    const delta = x - lastX.current;
    if (Math.abs(delta) > 3) hasDragged.current = true;
    offsetX.current  += delta;
    velocity.current  = delta;
    lastX.current     = x;
  }, []);

  const onUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (railRef.current) railRef.current.style.cursor = '';
  }, []);

  /* ── wheel → horizontal momentum ───────────────────────── */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // prefer horizontal delta (trackpad), fall back to vertical
      const raw   = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const delta = e.deltaMode === 1 ? raw * 16 : raw; // line → px
      velocity.current -= delta * WHEEL_MULT * 0.07;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const tm = (e: TouchEvent) => onMove(e.touches[0].clientX);
    window.addEventListener('mousemove', mm, { passive: true });
    window.addEventListener('touchmove', tm, { passive: true });
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchend',  onUp);
    };
  }, [onMove, onUp]);

  /* ── render one set of columns ───────────────────────── */
  const renderColumns = (keyPrefix: string) =>
    columns.map((col, ci) => {
      const firstRatio = photos[col.indices[0]].width / photos[col.indices[0]].height;
      const colW = firstRatio < 0.85
        ? `calc(${trackHeight} * 0.49)`
        : `calc(${trackHeight} * 0.75)`;

      return (
        <div
          key={`${keyPrefix}-${ci}`}
          style={{
            flexShrink:    0,
            width:         colW,
            height:        '100%',
            display:       'flex',
            flexDirection: 'column',
            gap:           'clamp(10px,1.6vmin,22px)',
          }}
        >
          {col.indices.map((photoIdx, si) => {
            const photo = photos[photoIdx];
            return (
              <div
                key={si}
                style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt ?? ''}
                  draggable={false}
                  className="bw-img"
                  onClick={() => { if (!hasDragged.current) onClickPhoto(photoIdx); }}
                  style={{
                    display:          'block',
                    width:            '100%',
                    height:           '100%',
                    objectFit:        'cover',
                    objectPosition:   '50% center', // overwritten each frame by rAF parallax
                    filter:           'brightness(0.82) saturate(0.8)',
                    transition:       'filter 0.4s ease',
                    cursor:           'inherit',
                    userSelect:       'none',
                    WebkitUserSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.02) saturate(1)';
                    e.currentTarget.style.cursor = 'zoom-in';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(0.82) saturate(0.8)';
                    e.currentTarget.style.cursor = 'grab';
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    });

  /* ── render ───────────────────────────────────────────── */
  return (
    <div
      ref={wrapperRef}
      style={{
        overflow:         'hidden',
        cursor:           'grab',
        userSelect:       'none',
        WebkitUserSelect: 'none',
        height:           trackHeight,
      }}
      onMouseDown={(e) => onDown(e.clientX)}
      onTouchStart={(e) => onDown(e.touches[0].clientX)}
    >
      {/* rail: two identical copies for seamless wrap */}
      <div
        ref={railRef}
        style={{
          display:       'flex',
          flexDirection: 'row',
          alignItems:    'stretch',
          gap:           'clamp(10px,1.6vmin,22px)',
          height:        '100%',
          willChange:    'transform',
          paddingLeft:   'clamp(1rem,3vw,3rem)',
          paddingRight:  'clamp(1rem,3vw,3rem)',
        }}
      >
        {renderColumns('a')}
        {renderColumns('b')}
      </div>
    </div>
  );
}

/* ── stub so any remaining chunkPhotos import doesn't break ── */
export function chunkPhotos<T>(arr: T[], _size: number): T[][] {
  return [arr];
}
