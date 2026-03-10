'use client';

import { useReducer, useRef, useCallback, memo, useState } from 'react';
import { uploadFile } from '@/app/admin/actions';
import { compressImage, getBucketPreset, formatSize } from '@/lib/compressImage';

type FileStatus = 'pending' | 'compressing' | 'uploading' | 'done' | 'error';

interface FileItem {
  id:        string;
  file:      File;
  preview:   string;
  status:    FileStatus;
  url:       string;
  width:     number;
  height:    number;
  error:     string;
  savedPct?: number; // compression gain %
}

interface Props {
  bucket:    string;
  /** Called once per photo after Storage upload, before DOM refresh */
  onUpload:  (url: string, width: number, height: number) => Promise<void>;
  /** Optional extra action after all photos are saved */
  onComplete?: () => void;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { resolve({ width: 1200, height: 800 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export default function MultiImageUpload({ bucket, onUpload, onComplete }: Props) {
  const [items, setItems]     = useState<FileItem[]>([]);
  const [running, setRunning] = useState(false);
  const [drag, setDrag]       = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const newItems: FileItem[] = await Promise.all(
      arr.map(async (file) => {
        const { width, height } = await getImageDimensions(file);
        return {
          id:      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
          status:  'pending' as FileStatus,
          url:     '',
          width,
          height,
          error:   '',
        };
      })
    );
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  async function handleUploadAll() {
    const pending = items.filter((i) => i.status === 'pending');
    if (!pending.length) return;
    setRunning(true);

    const preset = getBucketPreset(bucket);
    for (const item of pending) {
      // Step 1 — compress
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'compressing' } : i));
      let compressed: Awaited<ReturnType<typeof compressImage>>;
      try {
        compressed = await compressImage(item.file, preset);
      } catch {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'error', error: 'Compression échouée' } : i));
        continue;
      }
      const savedPct = Math.round((1 - compressed.compressedSize / compressed.originalSize) * 100);

      // Step 2 — upload
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const url = await uploadFile(bucket, compressed.file);
        await onUpload(url, compressed.width, compressed.height);
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'done', url, savedPct } : i));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur upload';
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'error', error: msg } : i));
      }
    }

    setRunning(false);
    onComplete?.();
    // Auto-clear done items after 1.5s
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.status !== 'done'));
    }, 1500);
  }

  const pendingCount  = items.filter((i) => i.status === 'pending').length;
  const doneCount     = items.filter((i) => i.status === 'done').length;
  const errorCount    = items.filter((i) => i.status === 'error').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

      {/* Drop zone */}
      <div
        onClick={() => !running && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        style={{
          border:          `1px dashed ${drag ? '#c8a97e' : 'rgba(255,255,255,0.15)'}`,
          background:       drag ? 'rgba(200,169,126,0.05)' : '#0e0e0e',
          borderRadius:     0,
          padding:          '1.6rem',
          display:          'flex',
          flexDirection:    'column',
          alignItems:       'center',
          justifyContent:   'center',
          gap:              '0.5rem',
          cursor:           running ? 'wait' : 'pointer',
          transition:       'border-color 0.2s, background 0.2s',
          textAlign:        'center',
        }}
      >
        <p style={{ fontSize: '1.6rem', opacity: 0.3, lineHeight: 1 }}>↑</p>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: '#7a7a74' }}>
          CLIQUER OU GLISSER DES IMAGES
        </p>
        <p style={{ fontSize: '0.58rem', color: '#4a4a44', letterSpacing: '0.06em' }}>
          Sélection multiple supportée
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
      />

      {/* Preview grid */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '4px' }}>
          {items.map((item) => (
            <div key={item.id} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#1a1a1a' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt=""
                style={{
                  width:      '100%',
                  height:     '100%',
                  objectFit:  'cover',
                  display:    'block',
                  opacity:    item.status === 'uploading' ? 0.35
                            : item.status === 'error'     ? 0.25
                            : 1,
                  transition: 'opacity 0.3s',
                }}
              />

              {/* Status overlay */}
              {item.status === 'compressing' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,8,0.55)' }}>
                  <span style={{ fontSize: '0.5rem', letterSpacing: '0.08em', color: '#c8a97e', textAlign: 'center', padding: '2px' }}>ZIP</span>
                </div>
              )}
              {item.status === 'uploading' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,8,0.5)' }}>
                  <span style={{ fontSize: '0.56rem', letterSpacing: '0.1em', color: '#c8a97e' }}>…</span>
                </div>
              )}
              {item.status === 'done' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,8,0.45)' }}>
                  <span style={{ fontSize: '1rem', color: '#6dbf7a' }}>✓</span>
                </div>
              )}
              {item.status === 'error' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,8,0.6)', padding: '4px' }}>
                  <span style={{ fontSize: '0.5rem', color: '#e07070', textAlign: 'center', lineHeight: 1.3 }}>
                    {item.error || 'erreur'}
                  </span>
                </div>
              )}

              {/* Remove button (only when not running) */}
              {!running && item.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(8,8,8,0.75)', border: 'none', color: '#e07070', width: '18px', height: '18px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              )}

              {/* Dimensions / savings badge */}
              {item.status === 'pending' && (
                <div style={{ position: 'absolute', bottom: '2px', left: '3px', fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', lineHeight: 1 }}>
                  {item.width}×{item.height} · {formatSize(item.file.size)}
                </div>
              )}
              {item.status === 'done' && item.savedPct !== undefined && item.savedPct > 0 && (
                <div style={{ position: 'absolute', bottom: '2px', left: '3px', fontSize: '0.45rem', color: '#6dbf7a', letterSpacing: '0.04em', lineHeight: 1 }}>
                  -{item.savedPct}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary + upload button */}
      {pendingCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            disabled={running}
            onClick={handleUploadAll}
            style={{
              background:    '#E8E4DC',
              color:         '#080808',
              border:        'none',
              padding:       '0.65rem 1.2rem',
              fontSize:      '0.62rem',
              letterSpacing: '0.14em',
              cursor:        running ? 'wait' : 'pointer',
              fontFamily:    'inherit',
              opacity:       running ? 0.6 : 1,
              transition:    'opacity 0.2s',
            }}
          >
            {running
              ? `TRAITEMENT EN COURS…`
              : `AJOUTER ${pendingCount} PHOTO${pendingCount > 1 ? 'S' : ''}`}
          </button>
          {(doneCount > 0 || errorCount > 0) && !running && (
            <span style={{ fontSize: '0.6rem', color: '#7a7a74', letterSpacing: '0.06em' }}>
              {doneCount > 0 && <span style={{ color: '#6dbf7a' }}>{doneCount} ok </span>}
              {errorCount > 0 && <span style={{ color: '#e07070' }}>{errorCount} erreur(s)</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
