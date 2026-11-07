import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et protection des données personnelles du site ghjulianucodani.com — conformité RGPD. / Privacy policy (GDPR).',
  robots: { index: false },
};

export default function PolitiqueConfidentialitePage() {
  return <PrivacyContent />;
}
