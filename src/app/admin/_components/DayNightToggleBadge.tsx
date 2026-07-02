'use client'

import { useState, useTransition } from 'react'
import { Sun, Moon } from 'lucide-react'
import { updatePortfolioPhotoDay } from '@/app/admin/actions'

interface Props {
  photoId: string
  isDay: boolean | null
}

export default function DayNightToggleBadge({ photoId, isDay }: Props) {
  const [value, setValue] = useState<boolean | null>(isDay)
  const [isPending, startTransition] = useTransition()

  function nextIsDay(current: boolean | null): boolean | null {
    if (current === null) return true
    if (current === true) return false
    return null
  }

  function handleClick() {
    const prev = value
    const next = nextIsDay(value)
    setValue(next)
    startTransition(async () => {
      try {
        await updatePortfolioPhotoDay(photoId, next)
      } catch {
        setValue(prev)
      }
    })
  }

  const pendingStyle = isPending ? { opacity: 0.5, pointerEvents: 'none' as const } : {}

  if (value === null) {
    return (
      <button
        onClick={handleClick}
        style={{ ...btnNull, ...pendingStyle }}
        aria-label="Marquer comme jour"
      />
    )
  }

  if (value === true) {
    return (
      <button
        onClick={handleClick}
        style={{ ...pillDay, ...pendingStyle }}
        aria-label="Marquer comme nuit"
      >
        <Sun size={10} color="#c8a97e" />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      style={{ ...pillNight, ...pendingStyle }}
      aria-label="Retirer le marquage"
    >
      <Moon size={10} color="#8090b0" />
    </button>
  )
}

const base: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 2,
  padding: '2px 4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: 'none',
}

const btnNull: React.CSSProperties = {
  ...base,
  background: 'transparent',
}

const pillDay: React.CSSProperties = {
  ...base,
  background: 'rgba(200,169,126,0.15)',
  border: '1px solid rgba(200,169,126,0.35)',
}

const pillNight: React.CSSProperties = {
  ...base,
  background: 'rgba(120,140,180,0.15)',
  border: '1px solid rgba(120,140,180,0.35)',
}
