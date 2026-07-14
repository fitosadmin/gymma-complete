import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { emptyDraft } from './types'
import type { GymDraft } from './types'

const DRAFT_KEY = 'gymma.builder.draft'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type SliceUpdater<K extends keyof GymDraft> = GymDraft[K] | ((prev: GymDraft[K]) => GymDraft[K])

interface BuilderContextValue {
  draft: GymDraft
  /** Patch any top-level slice (value or updater fn); autosaves 800ms later. */
  update: <K extends keyof GymDraft>(key: K, value: SliceUpdater<K>) => void
  saveStatus: SaveStatus
  resetDraft: () => void
}

const BuilderContext = createContext<BuilderContextValue | null>(null)

function loadDraft(): GymDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GymDraft
      if (parsed.version === 1) return parsed
    }
  } catch {
    /* corrupt draft — start clean */
  }
  return emptyDraft()
}

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<GymDraft>(loadDraft)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timer = useRef<number | undefined>(undefined)

  // ref mirrors the latest draft so the debounced write never persists stale state
  const latest = useRef<GymDraft>(draft)

  const schedulePersist = useCallback(() => {
    setSaveStatus('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...latest.current, updatedAt: new Date().toISOString() }),
        )
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 800)
  }, [])

  const update = useCallback(
    <K extends keyof GymDraft>(key: K, value: SliceUpdater<K>) => {
      setDraft((prev) => {
        const slice = typeof value === 'function' ? value(prev[key]) : value
        const next = { ...prev, [key]: slice }
        latest.current = next
        return next
      })
      schedulePersist()
    },
    [schedulePersist],
  )

  const resetDraft = useCallback(() => {
    window.clearTimeout(timer.current)
    localStorage.removeItem(DRAFT_KEY)
    const fresh = emptyDraft()
    latest.current = fresh
    setDraft(fresh)
    setSaveStatus('idle')
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const value = useMemo(
    () => ({ draft, update, saveStatus, resetDraft }),
    [draft, update, saveStatus, resetDraft],
  )

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
}

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error('useBuilder must be used inside BuilderProvider')
  return ctx
}
