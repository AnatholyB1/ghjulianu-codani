'use client';

import { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface Props {
  children: ReactNode;
  delay?: number;       // ms
  duration?: number;    // ms
  direction?: Direction;
  threshold?: number;   // 0-1
  style?: CSSProperties;
  className?: string;
}

function getHidden(direction: Direction): CSSProperties {
  const dist = '28px';
  switch (direction) {
    case 'up':    return { opacity: 0, transform: `translateY(${dist})` };
    case 'down':  return { opacity: 0, transform: `translateY(-${dist})` };
    case 'left':  return { opacity: 0, transform: `translateX(${dist})` };
    case 'right': return { opacity: 0, transform: `translateX(-${dist})` };
    default:      return { opacity: 0 };
  }
}

export default function ScrollReveal({
  children,
  delay    = 0,
  duration = 700,
  direction = 'up',
  threshold = 0.15,
  style,
  className,
}: Props) {
  const ref       = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShow(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const hidden  = getHidden(direction);
  const visible: CSSProperties = { opacity: 1, transform: 'translate(0,0)' };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        ...(show ? visible : hidden),
        transition: `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
