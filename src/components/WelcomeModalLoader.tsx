'use client';

import dynamic from 'next/dynamic';

const WelcomeModal = dynamic(() => import('./WelcomeModal'), { ssr: false });

export default function WelcomeModalLoader() {
  return <WelcomeModal />;
}
