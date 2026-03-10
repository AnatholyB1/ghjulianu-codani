'use client';

import { useState, useTransition, useRef } from 'react';
import { uploadFile } from '@/app/admin/actions';

interface Props {
  name:        string;
  bucket:      string;
  defaultUrl?: string;
  aspectHint?: string; // e.g. '16/9' for CSS aspect-ratio preview
}

export default function ImageUploadField({ name, bucket, defaultUrl, aspectHint }: Props) {
  const [url, setUrl]         = useState(defaultUrl ?? '');
  const [preview, setPreview] = useState(defaultUrl ?? '');
  const [pending, start]      = useTransition();
  const [error, setError]     = useState('');
  const [drag, setDrag]       = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Fichier non supporté.'); return; }
    setError('');
    // Immediate local preview
    const local = URL.createObjectURL(file);
    setPreview(local);
    start(async () => {
      try {
        const pub = await uploadFile(bucket, file);
        setUrl(pub);
        setPreview(pub);
        URL.revokeObjectURL(local);
      } catch {
        setError('Échec de l\'upload. Vérifiez le bucket Supabase.');
        setPreview(defaultUrl ?? '');
      }
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {/* URL hidden — sent to server action */}
      <input type="hidden" name={name} value={url} />

      {/* Drop zone */}
      <div
        onClick={() => !pending && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          border:         `1px dashed ${drag ? '#c8a97e' : pending ? '#c8a97e66' : 'rgba(255,255,255,0.15)'}`,
          background:      drag ? 'rgba(200,169,126,0.05)' : '#0e0e0e',
          cursor:          pending ? 'wait' : 'pointer',
          aspectRatio:     aspectHint ?? 'auto',
          minHeight:       '120px',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          overflow:        'hidden',
          position:        'relative',
          transition:      'border-color 0.2s, background 0.2s',
        }}
      >
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt="preview"
            style={{
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              opacity:    pending ? 0.4 : 1,
              transition: 'opacity 0.3s',
              display:    'block',
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', pointerEvents: 'none' }}>
            <p style={{ fontSize: '1.4rem', marginBottom: '0.5rem', opacity: 0.3 }}>↑</p>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: '#7a7a74' }}>
              CLIQUER OU GLISSER UNE IMAGE
            </p>
          </div>
        )}

        {pending && (
          <div style={{
            position:        'absolute',
            inset:           0,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            background:      'rgba(8,8,8,0.6)',
          }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.18em', color: '#c8a97e' }}>
              UPLOAD EN COURS…
            </p>
          </div>
        )}

        {preview && !pending && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPreview(''); setUrl(''); }}
            style={{
              position:   'absolute',
              top:        '6px',
              right:      '6px',
              background: 'rgba(8,8,8,0.75)',
              border:     'none',
              color:      '#e07070',
              width:      '22px',
              height:     '22px',
              fontSize:   '11px',
              cursor:     'pointer',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <p style={{ fontSize: '0.63rem', color: '#e07070', marginTop: '0.4rem', letterSpacing: '0.06em' }}>{error}</p>
      )}

      {url && !pending && (
        <p style={{ fontSize: '0.56rem', color: '#7a7a74', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ✓ {url.split('/').pop()}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
