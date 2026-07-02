'use client';

import { useState, useTransition }          from 'react';
import { Sun, Moon }                         from 'lucide-react';
import ConfirmButton                          from './ConfirmButton';
import { deleteAlbumPhoto, reorderAlbumPhotos, updateAlbumPhotoDay } from '../actions';
import type { AlbumPhoto }                   from '@/lib/db.types';

interface Props {
  photos:     AlbumPhoto[];
  albumId:    string;
  albumIsDay?: boolean | null;
}

function getBadgeState(
  photoIsDay: boolean | null,
  albumIsDay: boolean | null | undefined
): { type: 'inherited'; value: boolean } | { type: 'explicit'; value: boolean } | null {
  if (photoIsDay !== null) return { type: 'explicit', value: photoIsDay }
  if (albumIsDay != null) return { type: 'inherited', value: albumIsDay }
  return null
}

/**
 * Drag-to-reorder photo grid (HTML5 DnD, zero deps).
 *
 * - Drag any card and drop it onto another to reposition it.
 * - The new order is saved immediately via `reorderAlbumPhotos`.
 * - Position numbers are shown in the corner of each card.
 * - Delete still works per-card.
 */
export default function DraggablePhotoGrid({ photos: initial, albumId, albumIsDay }: Props) {
  const [photos,    setPhotos]   = useState<AlbumPhoto[]>(initial);
  const [dragId,    setDragId]   = useState<string | null>(null);
  const [overId,    setOverId]   = useState<string | null>(null);
  const [isPending, startTrans]  = useTransition();
  const [badgePending, startBadgeTrans] = useTransition();
  const [resetPhotoId, setResetPhotoId] = useState<string | null>(null);

  /* ── drag handlers ───────────────────────────────────────── */
  function onDragStart(id: string) {
    setDragId(id);
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();         // required to allow drop
    e.dataTransfer.dropEffect = 'move';
    if (id !== overId) setOverId(id);
  }

  function onDrop(e: React.DragEvent, toId: string) {
    e.preventDefault();
    if (!dragId || dragId === toId) {
      setDragId(null);
      setOverId(null);
      return;
    }

    const fromIdx = photos.findIndex(p => p.id === dragId);
    const toIdx   = photos.findIndex(p => p.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const next = [...photos];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    setPhotos(next);
    setDragId(null);
    setOverId(null);

    startTrans(() => reorderAlbumPhotos(albumId, next.map(p => p.id)));
  }

  function onDragEnd() {
    setDragId(null);
    setOverId(null);
  }

  /* ── badge handlers ──────────────────────────────────────── */
  function handleBadgeClick(photoId: string, newValue: boolean | null) {
    const prev = photos.find(p => p.id === photoId)?.is_day ?? null;
    setPhotos(prevPhotos => prevPhotos.map(p => p.id === photoId ? { ...p, is_day: newValue } : p));
    startBadgeTrans(async () => {
      try {
        await updateAlbumPhotoDay(photoId, albumId, newValue);
      } catch {
        setPhotos(p => p.map(ph => ph.id === photoId ? { ...ph, is_day: prev } : ph));
      }
    });
  }

  function handleResetToAlbum(photoId: string) {
    handleBadgeClick(photoId, null);
    setResetPhotoId(null);
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div>
      {/* hint row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <p style={hint}>
          ⠿ GLISSEZ POUR RÉORGANISER
        </p>
        {isPending && <p style={{ ...hint, color: '#c8a97e' }}>SAUVEGARDE…</p>}
      </div>

      {/* grid */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))',
          gap:                 '4px',
        }}
      >
        {photos.map((photo, i) => {
          const isDragging = dragId === photo.id;
          const isOver     = overId  === photo.id && dragId !== photo.id;

          return (
            <div
              key={photo.id}
              draggable
              onDragStart={() => onDragStart(photo.id)}
              onDragOver={(e) => onDragOver(e, photo.id)}
              onDrop={(e) => onDrop(e, photo.id)}
              onDragEnd={onDragEnd}
              style={{
                position:      'relative',
                aspectRatio:   '1',
                overflow:      'hidden',
                background:    '#1a1a1a',
                cursor:        isDragging ? 'grabbing' : 'grab',
                opacity:       isDragging ? 0.3 : 1,
                outline:       isOver ? '2px solid #c8a97e' : '2px solid transparent',
                outlineOffset: '-2px',
                transition:    'opacity 0.15s, outline-color 0.1s',
                userSelect:    'none',
              }}
            >
              {/* photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt ?? ''}
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
              />

              {/* position badge */}
              <span style={{
                position:    'absolute',
                bottom:      '3px',
                left:        '4px',
                fontSize:    '9px',
                lineHeight:  1,
                color:       'rgba(255,255,255,0.45)',
                pointerEvents: 'none',
                fontFamily:  'monospace',
              }}>
                {i + 1}
              </span>

              {/* delete button */}
              <div style={{ position: 'absolute', top: '3px', right: '3px' }}>
                <ConfirmButton
                  formAction={deleteAlbumPhoto.bind(null, photo.id, albumId)}
                  message="Supprimer ?"
                  style={{
                    background: 'rgba(8,8,8,0.8)',
                    border:     'none',
                    color:      '#e07070',
                    width:      '20px',
                    height:     '20px',
                    fontSize:   '10px',
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor:     'pointer',
                  }}
                >
                  ✕
                </ConfirmButton>
              </div>

              {/* inheritance badge */}
              {(() => {
                const badgeState = getBadgeState(photo.is_day, albumIsDay)
                if (!badgeState) return null

                if (badgeState.type === 'inherited') {
                  const oppositeValue = albumIsDay === true ? false : true
                  return (
                    <button
                      style={{ ...badgeInherited, ...(badgePending ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
                      onClick={() => handleBadgeClick(photo.id, oppositeValue)}
                      aria-label="Définir un jour/nuit explicite"
                    >
                      {badgeState.value === true
                        ? <Sun size={10} style={{ color: 'rgba(200,169,126,0.75)' }} />
                        : <Moon size={10} style={{ color: 'rgba(120,140,180,0.75)' }} />
                      }
                      <span style={{ fontSize: '0.58rem' }}>1</span>
                    </button>
                  )
                }

                // explicit override
                if (resetPhotoId === photo.id) {
                  return (
                    <button
                      style={{ ...badgeReset, ...(badgePending ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
                      aria-label="Réinitialiser au mode album"
                    >
                      <span style={{ fontSize: '0.58rem' }}>ALBUM ↩</span>
                    </button>
                  )
                }

                return (
                  <button
                    style={{
                      ...(badgeState.value === true ? badgeDay : badgeNight),
                      ...(badgePending ? { opacity: 0.5, pointerEvents: 'none' } : {})
                    }}
                    onClick={() => {
                      setResetPhotoId(photo.id)
                      setTimeout(() => handleResetToAlbum(photo.id), 1500)
                    }}
                    aria-label="Réinitialiser au mode album"
                  >
                    {badgeState.value === true
                      ? <Sun size={10} style={{ color: '#c8a97e' }} />
                      : <Moon size={10} style={{ color: '#8090b0' }} />
                    }
                    <span style={{ fontSize: '0.58rem' }}>!</span>
                  </button>
                )
              })()}
            </div>
          );
        })}
      </div>

      {photos.length === 0 && (
        <p style={{ fontSize: '0.72rem', color: '#7a7a74', marginTop: '0.5rem' }}>Aucune photo.</p>
      )}
    </div>
  );
}

const hint: React.CSSProperties = {
  fontSize:      '0.54rem',
  letterSpacing: '0.14em',
  color:         '#5a5a54',
};

const badgeDay: React.CSSProperties = {
  position: 'absolute',
  bottom: 3,
  right: 3,
  background: 'rgba(200,169,126,0.15)',
  border: '1px solid rgba(200,169,126,0.35)',
  borderRadius: 2,
  padding: '2px 4px',
  fontSize: '0.58rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  cursor: 'pointer',
}

const badgeNight: React.CSSProperties = {
  ...badgeDay,
  background: 'rgba(120,140,180,0.15)',
  border: '1px solid rgba(120,140,180,0.35)',
}

const badgeInherited: React.CSSProperties = {
  position: 'absolute',
  bottom: 3,
  right: 3,
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 2,
  padding: '2px 4px',
  fontSize: '0.58rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  cursor: 'pointer',
  opacity: 0.85,
}

const badgeReset: React.CSSProperties = {
  ...badgeInherited,
  color: '#e07070',
  opacity: 1,
}
