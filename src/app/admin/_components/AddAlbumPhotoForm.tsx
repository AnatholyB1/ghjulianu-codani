'use client';

import { useRouter } from 'next/navigation';
import MultiImageUpload from './MultiImageUpload';
import { saveAlbumPhoto } from '@/app/admin/actions';

export default function AddAlbumPhotoForm({ albumId }: { albumId: string }) {
  const router = useRouter();

  async function handleUpload(url: string, width: number, height: number) {
    await saveAlbumPhoto(albumId, url, width, height);
  }

  function handleComplete() {
    router.refresh();
  }

  return (
    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <MultiImageUpload
        bucket="album-photos"
        onUpload={handleUpload}
        onComplete={handleComplete}
      />
    </div>
  );
}
