'use client'

import { useState, useTransition } from 'react'
import type { PortfolioPhoto } from '@/lib/db.types'
import ConfirmButton from '../../_components/ConfirmButton'
import DayNightToggleBadge from '../../_components/DayNightToggleBadge'
import { deletePortfolioPhoto, bulkUpdatePortfolioPhotoDay } from '../../actions'

export default function PortfolioAdminGrid({ initialPhotos }: { initialPhotos: PortfolioPhoto[] }) {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>(initialPhotos)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPending, startBulkTrans] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectedIds(new Set())
      setSelectionMode(false)
    } else {
      setSelectionMode(true)
    }
  }

  function toggleCard(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleBulkUpdate(isDay: boolean | null) {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const prevPhotos = photos
    setErrorMsg(null)
    // Optimistic update
    setPhotos(current =>
      current.map(p => ids.includes(p.id) ? { ...p, is_day: isDay } : p)
    )
    startBulkTrans(async () => {
      try {
        await bulkUpdatePortfolioPhotoDay(ids, isDay)
        setSelectedIds(new Set())
        setSelectionMode(false)
      } catch {
        setPhotos(prevPhotos)
        setErrorMsg('Erreur — réessayez.')
      }
    })
  }

  const disabledBulk = selectedIds.size === 0 || bulkPending
  const disabledStyle: React.CSSProperties = disabledBulk
    ? { opacity: 0.4, pointerEvents: 'none' }
    : {}

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <p style={cardTitle}>PHOTOS ({photos.length})</p>
        <button
          onClick={toggleSelectionMode}
          style={selectionMode ? btnSelectModeActive : btnSelectMode}
        >
          {selectionMode ? 'ANNULER' : 'SÉLECTIONNER'}
        </button>
      </div>

      {/* Bulk action bar */}
      {selectionMode && (
        <div style={bulkBar}>
          <button
            onClick={() => handleBulkUpdate(true)}
            style={{ ...btnBulkDay, ...disabledStyle }}
            disabled={bulkPending}
          >
            {bulkPending ? 'MISE À JOUR…' : 'JOUR'}
          </button>
          <button
            onClick={() => handleBulkUpdate(false)}
            style={{ ...btnBulkNight, ...disabledStyle }}
            disabled={bulkPending}
          >
            NUIT
          </button>
          <button
            onClick={() => handleBulkUpdate(null)}
            style={{ ...btnBulkUntagged, ...disabledStyle }}
            disabled={bulkPending}
          >
            NON TAGGÉ
          </button>
          <span style={bulkCounter}>
            {bulkPending ? <span style={{ color: '#c8a97e' }}>Mise à jour…</span> : `${selectedIds.size} sélectionné(s)`}
          </span>
        </div>
      )}

      {errorMsg && (
        <p style={{ fontSize: '0.58rem', color: '#e07070', marginBottom: '0.5rem' }}>{errorMsg}</p>
      )}

      {/* Photo grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '4px' }}>
        {photos.map((photo: PortfolioPhoto) => {
          const isSelected = selectedIds.has(photo.id)
          return (
            <div
              key={photo.id}
              onClick={selectionMode ? () => toggleCard(photo.id) : undefined}
              style={{
                position: 'relative',
                background: isSelected ? 'rgba(200,169,126,0.08)' : '#1a1a1a',
                outline: isSelected ? '2px solid rgba(200,169,126,0.5)' : 'none',
                cursor: selectionMode ? 'pointer' : 'default',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt ?? ''}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
              />

              {/* Normal mode overlays */}
              {!selectionMode && (
                <>
                  <div style={{ position: 'absolute', top: '3px', right: '26px' }}>
                    <DayNightToggleBadge photoId={photo.id} isDay={photo.is_day} />
                  </div>
                  <ConfirmButton
                    formAction={deletePortfolioPhoto.bind(null, photo.id)}
                    message="Supprimer ?"
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      background: 'none',
                      border: 'none',
                      color: '#e07070',
                      fontSize: '0.65rem',
                      padding: '2px 4px',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </ConfirmButton>
                </>
              )}

              {/* Selection mode checkbox overlay */}
              {selectionMode && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    width: '14px',
                    height: '14px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: isSelected ? '#c8a97e' : '#080808',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {photos.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: '#7a7a74' }}>Aucune photo dans le portfolio.</p>
      )}
    </div>
  )
}

const cardTitle: React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74' }
const btnSelectMode: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#E8E4DC', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }
const btnSelectModeActive: React.CSSProperties = { ...btnSelectMode, border: '1px solid rgba(200,169,126,0.4)', color: '#c8a97e' }
const bulkBar: React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }
const btnBulkDay: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(200,169,126,0.4)', color: '#c8a97e', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' }
const btnBulkNight: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(120,140,180,0.4)', color: '#8090b0', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' }
const btnBulkUntagged: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#E8E4DC', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' }
const bulkCounter: React.CSSProperties = { marginLeft: 'auto', fontSize: '0.58rem', letterSpacing: '0.1em', color: '#7a7a74' }
