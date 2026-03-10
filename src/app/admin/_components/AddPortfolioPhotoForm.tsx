'use client';

import { useRouter } from 'next/navigation';
import MultiImageUpload from './MultiImageUpload';
import { savePortfolioPhoto } from '@/app/admin/actions';

export default function AddPortfolioPhotoForm() {
  const router = useRouter();

  async function handleUpload(url: string, width: number, height: number) {
    await savePortfolioPhoto(url, width, height);
  }

  function handleComplete() {
    router.refresh();
  }

  return (
    <MultiImageUpload
      bucket="portfolio-photos"
      onUpload={handleUpload}
      onComplete={handleComplete}
    />
  );
}
