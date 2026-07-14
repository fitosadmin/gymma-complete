import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ImagePlus, Lightbulb, Loader2, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { compressToDataUrl } from '../../lib/image'

/* Shared builder-step scaffolding */

export function StepShell({
  step,
  title,
  sub,
  tip,
  children,
}: {
  step: string
  title: string
  sub?: string
  tip?: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="eyebrow">{step}</p>
      <h2 className="mt-2 text-h2 text-navy">{title}</h2>
      {sub && <p className="mt-2 max-w-[55ch] text-[15px] text-muted">{sub}</p>}
      <div className="mt-8 space-y-6">{children}</div>
      {tip && (
        <p className="mt-8 flex items-start gap-2 rounded-md bg-copper/8 px-4 py-3 text-[13px] text-copper-dark">
          <Lightbulb size={15} aria-hidden className="mt-0.5 shrink-0" />
          {tip}
        </p>
      )}
    </div>
  )
}

/** Premium image upload tile: click/drop → compress → instant preview. */
export function UploadTile({
  label,
  value,
  onChange,
  aspect = 'aspect-video',
  maxDim = 1280,
}: {
  label: string
  value: string | null
  onChange: (dataUrl: string | null) => void
  aspect?: string
  maxDim?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setBusy(true)
    try {
      onChange(await compressToDataUrl(file, maxDim))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-2 font-display text-[13px] font-bold text-ink">{label}</p>
      <div
        className={cn(
          'relative overflow-hidden rounded-md border-2 border-dashed transition-colors duration-(--t-fast)',
          aspect,
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
          void handleFiles(e.dataTransfer.files)
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-navy-deep/70 text-white transition-colors hover:bg-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <X size={15} aria-hidden />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-inset"
          >
            <span className="flex flex-col items-center gap-2 text-muted">
              {busy ? <Loader2 size={22} className="animate-spin" aria-hidden /> : <ImagePlus size={22} aria-hidden />}
              <span className="text-[13px] font-semibold">
                {busy ? 'Processing…' : 'Click or drop an image'}
              </span>
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}

/** Selectable card — the checkbox-card pattern for facilities/equipment. */
export function SelectCard({
  selected,
  onToggle,
  children,
  className,
}: {
  selected: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 rounded-md border px-4 py-3.5 text-left text-[14px] font-semibold',
        'transition-all duration-(--t-fast) active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
        selected
          ? 'border-copper bg-copper/8 text-copper-dark shadow-sm'
          : 'border-line bg-card text-ink hover:border-muted/50',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-[6px] border transition-colors duration-(--t-fast)',
          selected ? 'border-copper bg-copper text-white' : 'border-line bg-white',
        )}
      >
        {selected && '✓'}
      </span>
      {children}
    </button>
  )
}
