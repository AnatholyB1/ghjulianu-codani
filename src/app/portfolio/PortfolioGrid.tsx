'use client';

import { useEffect, useRef, useState } from 'react';
import Image    from 'next/image';
import Lightbox from '@/components/Lightbox';
import type { PortfolioPhoto } from '@/lib/db.types';

type LBPhoto = { src: string; width: number; height: number; alt: string; context?: string };

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
          sizes="(max-width:600px) calc(50vw - 2rem), (max-width:1100px) calc(33vw - 2rem), 400px"
          style={{
            display:        'block',
            width:          '100%',
            height:         'auto',
            filter:         'brightness(1) saturate(1)',
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

export default function PortfolioGrid({ photos }: { photos: PortfolioPhoto[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const lbPhotos: LBPhoto[] = photos.map((p) => ({
    src: p.src, width: p.width, height: p.height, alt: p.alt ?? '', context: 'Portfolio',
  }));

  return (
    <>
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
