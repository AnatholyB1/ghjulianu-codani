'use client';

import { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import type { Album, Category } from '@/lib/db.types';
import { reorderAlbums, deleteAlbum } from '../../actions';
import ConfirmButton from '../../_components/ConfirmButton';

type AlbumRow = Album & { category?: Category | null };

export default function AlbumSortableList({ initialAlbums }: { initialAlbums: AlbumRow[] }) {
  const [albums,   setAlbums]   = useState<AlbumRow[]>(initialAlbums);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [isPending, startTransition] = useTransition();

  /* ── drag state ─────────────────────────── */
  const dragIdx  = useRef<number | null>(null);
  const overIdx  = useRef<number | null>(null);

  function onDragStart(i: number) {
    dragIdx.current = i;
  }

  function onDragEnter(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    overIdx.current = i;
    const reordered = [...albums];
    const [moved]   = reordered.splice(dragIdx.current, 1);
    reordered.splice(i, 0, moved);
    dragIdx.current = i;
    setAlbums(reordered);
  }

  function onDragEnd() {
    dragIdx.current = null;
    overIdx.current = null;
    // Persist
    setSaving(true);
    setSaved(false);
    startTransition(async () => {
      await reorderAlbums(albums.map((a) => a.id));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div>
      {/* Status indicator */}
      <div
        style={{
          height:     '24px',
          marginBottom: '0.75rem',
          fontSize:   '0.6rem',
          letterSpacing: '0.1em',
          color:      saving ? '#c8a97e' : saved ? '#6dbf7a' : 'transparent',
          transition: 'color 0.3s',
        }}
      >
        {saving ? '⟳  Enregistrement…' : saved ? '✓  Ordre sauvegardé' : '·'}
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}
        onDragOver={(e) => e.preventDefault()}
      >
        {albums.map((album, i) => (
          <div
            key={album.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragEnd={onDragEnd}
            style={{
              background:   dragIdx.current === i ? 'rgba(200,169,126,0.06)' : '#0e0e0e',
              border:       `1px solid ${dragIdx.current === i ? 'rgba(200,169,126,0.3)' : 'rgba(255,255,255,0.05)'}`,
              padding:      '0.9rem 1.2rem',
              display:      'flex',
              alignItems:   'center',
              gap:          '1rem',
              flexWrap:     'wrap',
              cursor:       'grab',
              transition:   'background 0.15s, border-color 0.15s',
              userSelect:   'none',
            }}
          >
            {/* Drag handle */}
            <span
              style={{
                flexShrink:  0,
                color:       'rgba(122,122,116,0.4)',
                fontSize:    '0.7rem',
                lineHeight:  1,
                cursor:      'grab',
                paddingRight: '0.2rem',
              }}
              title="Glisser pour réorganiser"
            >
              ⠿
            </span>

            {/* Cover thumbnail */}
            {album.cover_url
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={album.cover_url}
                  alt={album.title}
                  style={{ width: '48px', height: '48px', objectFit: 'cover', flexShrink: 0, filter: 'brightness(0.7)', pointerEvents: 'none' }}
                />
              ) : (
                <div style={{ width: '48px', height: '48px', background: '#1a1a1a', flexShrink: 0 }} />
              )
            }

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.9rem', color: '#E8E4DC', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {album.title}
              </p>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {album.year     && <span style={tag}>{album.year}</span>}
                {album.category && <span style={tag}>{album.category.name}</span>}
                <span style={{ ...tag, color: album.is_public ? '#6dbf7a' : '#c8a97e' }}>
                  {album.is_public ? '● PUBLIC' : '🔒 PRIVÉ'}
                </span>
                <span style={{ ...tag, color: 'rgba(122,122,116,0.4)' }}>#{album.sort_order}</span>
              </div>
            </div>

            {/* Actions — stop drag propagation */}
            <div
              style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}
              onMouseDown={(e) => e.stopPropagation()}
              draggable={false}
            >
              <Link
                href={`/admin/albums/${album.id}`}
                draggable={false}
                style={btnEdit}
              >
                MODIFIER
              </Link>
              <ConfirmButton
                formAction={deleteAlbum.bind(null, album.id)}
                message={`Supprimer "${album.title}" ?`}
                style={btnDelete}
              >
                SUPPRIMER
              </ConfirmButton>
            </div>
          </div>
        ))}

        {albums.length === 0 && (
          <p style={{ fontSize: '0.8rem', color: '#7a7a74', padding: '2rem 0' }}>
            Aucun album.{' '}
            <Link href="/admin/albums/new" style={{ color: '#c8a97e' }}>Créer le premier →</Link>
          </p>
        )}
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.58rem', color: 'rgba(122,122,116,0.45)', letterSpacing: '0.08em' }}>
        Glissez les lignes pour changer l'ordre d'affichage — sauvegarde automatique.
      </p>
    </div>
  );
}

const tag:       React.CSSProperties = { fontSize: '0.56rem', letterSpacing: '0.1em', color: '#7a7a74' };
const btnEdit:   React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#E8E4DC', padding: '0.3rem 0.7rem', fontSize: '0.58rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' };
const btnDelete: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(200,80,80,0.3)', color: '#e07070', padding: '0.3rem 0.7rem', fontSize: '0.58rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' };
