import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { compressToDataUrl } from '../../lib/image'
import { GALLERY_CATEGORIES } from '../catalog'
import { uid } from '../types'
import { useBuilder } from '../store'
import { StepShell } from './shared'

export function StepGallery() {
  const { draft, update } = useBuilder()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function addFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    try {
      const added = await Promise.all(
        Array.from(files)
          .filter((f) => f.type.startsWith('image/'))
          .slice(0, 12 - draft.gallery.length)
          .map(async (f) => ({ id: uid(), dataUrl: await compressToDataUrl(f, 1080, 0.75), category: 'Interior' })),
      )
      update('gallery', (prev) => [...prev, ...added].slice(0, 12))
    } finally {
      setBusy(false)
    }
  }

  function patchImage(id: string, category: string) {
    update('gallery', (prev) => prev.map((g) => (g.id === id ? { ...g, category } : g)))
  }

  function removeImage(id: string) {
    update('gallery', (prev) => prev.filter((g) => g.id !== id))
  }

  function move(id: string, dir: -1 | 1) {
    update('gallery', (prev) => {
      const idx = prev.findIndex((g) => g.id === id)
      const to = idx + dir
      if (idx < 0 || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next
    })
  }

  return (
    <StepShell
      step="Step 3 · Gallery"
      title="Show off your space"
      sub="Photos are the #2 trust signal after reviews. The first image becomes your gallery highlight."
      tip="Washroom and locker-room photos answer the hygiene question before anyone asks it."
    >
      <div
        className={cn(
          'grid min-h-40 place-items-center rounded-md border-2 border-dashed p-8 text-center transition-colors duration-(--t-fast)',
          dragOver ? 'border-copper bg-copper/5' : 'border-line bg-card',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void addFiles(e.dataTransfer.files)
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2 text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-md p-2"
        >
          {busy ? <Loader2 size={26} className="animate-spin" aria-hidden /> : <ImagePlus size={26} aria-hidden />}
          <span className="text-[14px] font-semibold text-ink">
            {busy ? 'Compressing…' : 'Drop photos here, or click to browse'}
          </span>
          <span className="text-caption">Up to 12 photos · JPG or PNG · we optimize them for you</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void addFiles(e.target.files)} />
      </div>

      {draft.gallery.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {draft.gallery.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-md border border-line bg-card">
              <div className="relative aspect-video">
                <img src={img.dataUrl} alt={img.category} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-pill bg-gradient-brand px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider text-white">
                    Highlight
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-navy-deep/70 text-white hover:bg-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                >
                  <X size={13} aria-hidden />
                </button>
              </div>
              <div className="flex items-center gap-1 p-2">
                <select
                  aria-label="Photo category"
                  value={img.category}
                  onChange={(e) => patchImage(img.id, e.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-[8px] border border-line bg-white px-1.5 text-[12px] focus:border-copper focus:outline-none"
                >
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button type="button" aria-label="Move earlier" onClick={() => move(img.id, -1)} className="grid size-8 place-items-center rounded-[8px] text-muted hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper">
                  <ArrowLeft size={14} aria-hidden />
                </button>
                <button type="button" aria-label="Move later" onClick={() => move(img.id, 1)} className="grid size-8 place-items-center rounded-[8px] text-muted hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper">
                  <ArrowRight size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </StepShell>
  )
}
