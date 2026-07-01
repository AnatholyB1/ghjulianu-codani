'use client';

import { useEffect, useRef, useState } from 'react';
import Image    from 'next/image';
import Lightbox from '@/components/Lightbox';
import type { PortfolioPhoto } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/client';
import { useDayNight }  from '@/hooks/useDayNight';

type LBPhoto = { src: string; width: number; height: number; alt: string; context?: string };

// Fisher-Yates shuffle — returns a new shuffled array without mutating the original
function shuffle<T>(arr: T[]): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function PhotoCard({
  src, width, height, alt, index, onClick,
}: {
  src: string; width: number; height: number; alt?: string;
  index: number; onClick: () => void;
}) {
  const ref              = useRef<HTMLDivElement>(null);
  const [vis,  setVis]   = useState(false);
  const [hov,  setHov]   = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVis(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delay = (index % 4) * 60;

  return (
    <div
      ref={ref}
      style={{
        breakInside:  'avoid',
        marginBottom: 'clamp(10px,1.4vmin,20px)',
        display:      'block',
        position:     'relative',
        opacity:       vis ? 1 : 0,
        transform:     vis ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
        transition:   `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                       transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* image */}
      <div
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{ overflow: 'hidden', cursor: 'zoom-in', display: 'block' }}
      >
        <Image
          src={src}
          alt={alt ?? ''}
          width={width}
          height={height}
          draggable={false}
          style={{
            display:        'block',
            width:          '100%',
            height:         'auto',
            transform:      hov ? 'scale(1.025)' : 'scale(1)',
            transition:     'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
            userSelect:     'none',
            WebkitUserSelect: 'none',
            pointerEvents:  'none',
          }}
        />
      </div>
    </div>
  );
}

export default function PortfolioGrid() {
  const { mode } = useDayNight();
  const [photos,   setPhotos]   = useState<PortfolioPhoto[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    // Do NOT clear photos — keep previous list visible while new fetch is in-flight
    const supabase = createClient();

    let query = supabase.from('portfolio_photos').select('*');

    if (mode === 'day') {
      query = query.or('is_day.is.null,is_day.eq.true');
    } else {
      query = query.or('is_day.is.null,is_day.eq.false');
    }

    query.then(({ data }) => {
      setPhotos(shuffle(data ?? []));
    });
  }, [mode]);

  const lbPhotos: LBPhoto[] = photos.map((p) => ({
    src: p.src, width: p.width, height: p.height, alt: p.alt ?? '', context: 'Portfolio',
  }));

  return (
    <>
      {photos.length === 0 ? (
        <div className="text-center py-8 text-sm opacity-60">
          No photos available in this mode yet
        </div>
      ) : (
        <section style={{ padding: 'clamp(2rem,4vw,4rem) clamp(1rem,3vw,3rem)', columns: '4 180px', columnGap: 'clamp(10px,1.4vmin,20px)' }}>
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              src={photo.src}
              width={photo.width}
              height={photo.height}
              alt={photo.alt ?? ''}
              index={i}
              onClick={() => setLightbox(i)}
            />
          ))}
        </section>
      )}

      {lightbox !== null && (
        <Lightbox
          photos={lbPhotos}
          index={lightbox}
          showCart={false}
          onClose={() => setLightbox(null)}
          onNext={() => setLightbox((lightbox + 1) % photos.length)}
          onPrev={() => setLightbox((lightbox - 1 + photos.length) % photos.length)}
        />
      )}
    </>
  );
}
