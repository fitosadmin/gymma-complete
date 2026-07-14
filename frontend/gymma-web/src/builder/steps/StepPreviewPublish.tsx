import { Monitor, Rocket, Smartphone, Tablet } from 'lucide-react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/cn'
import { useBuilder } from '../store'
import { missingRequired } from '../BuilderPage'
import { completionScore } from '../completion'
import { StepShell } from './shared'
import type { PreviewDevice } from '../PreviewPane'

const devices: { id: PreviewDevice; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

export function StepPreviewPublish({
  device,
  onDevice,
  onPublish,
  publishing,
  onJump,
}: {
  device: PreviewDevice
  onDevice: (d: PreviewDevice) => void
  onPublish: () => void
  publishing: boolean
  onJump: (step: number) => void
}) {
  const { draft } = useBuilder()
  const missing = missingRequired(draft)
  const score = completionScore(draft)

  return (
    <StepShell
      step="Step 12 · Preview & publish"
      title="This is your website"
      sub="Walk through it on every device. When it feels right, hit publish — it goes live instantly."
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Preview device">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={device === d.id}
            onClick={() => onDevice(d.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-[13px] font-semibold',
              'transition-colors duration-(--t-fast) active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
              device === d.id ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink hover:border-muted/50',
            )}
          >
            <d.icon size={15} aria-hidden /> {d.label}
          </button>
        ))}
      </div>

      {missing.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/8 px-4 py-3 text-[13px] text-warning" role="alert">
          <p className="font-semibold">A professional page needs {missing.length} more thing{missing.length > 1 ? 's' : ''}:</p>
          <ul className="mt-1.5 space-y-1">
            {missing.map((mi) => (
              <li key={mi.label}>
                <button
                  type="button"
                  onClick={() => onJump(mi.step)}
                  className="underline underline-offset-2 transition-colors duration-(--t-fast) hover:text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper rounded-[3px]"
                >
                  Add your {mi.label} → step {mi.step}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-line bg-card p-6">
        <p className="text-[15px] text-muted">
          Your website is <strong className="text-ink">{score}% complete</strong> and will go live at{' '}
          <span className="font-semibold text-copper-dark">gymma.com/gym/{draft.seo.slug || 'your-gym'}</span>{' '}
          with a printable QR code. You can come back and edit anytime — changes republish instantly.
        </p>
        <Button className="mt-5" onClick={onPublish} loading={publishing} disabled={missing.length > 0}>
          <Rocket size={16} aria-hidden className="mr-1.5" /> Publish my gym website
        </Button>
      </div>
    </StepShell>
  )
}
