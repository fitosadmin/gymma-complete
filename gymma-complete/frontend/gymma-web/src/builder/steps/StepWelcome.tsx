import { Clock3, Dumbbell, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui'

export function StepWelcome({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
      <span className="icon-tile mb-6 !size-16 !rounded-[18px]">
        <Dumbbell size={28} aria-hidden />
      </span>
      <p className="eyebrow">Gymma Website Builder</p>
      <h1 className="mt-3 max-w-[16ch] text-display text-navy">
        Let's build your gym website.
      </h1>
      <p className="mt-4 max-w-[46ch] text-body-l text-muted">
        Answer a few quick questions and watch your premium page come to life — live, as you type.
        No tech skills. No designer. No code.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[14px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={15} aria-hidden className="text-copper" /> 2–3 minutes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={15} aria-hidden className="text-copper" /> Free with every Gymma plan
        </span>
      </div>
      <Button className="mt-10" onClick={onBegin}>
        Begin — it's free
      </Button>
      <p className="mt-3 text-caption text-muted">Everything autosaves. Leave anytime, pick up where you left off.</p>
    </div>
  )
}
