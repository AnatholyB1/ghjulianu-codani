'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function RetryButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn" disabled={pending} onClick={() => start(() => router.refresh())}>
      {pending ? 'Chargement…' : 'Réessayer'}
    </button>
  );
}
