import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, Loader2, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { Button } from '../components/ui'
import { dur, ease } from '../lib/motion'
import { BuilderProvider, useBuilder } from './store'
import { slugify } from './types'
import type { GymDraft } from './types'
import { publishGym } from '../gym/publishStore'
import { GymPage } from '../gym/GymPage'
import { completionScore } from './completion'
import { WizardProgress } from './WizardProgress'
import { PublishingOverlay } from './PublishingOverlay'
import { PreviewPane } from './PreviewPane'
import type { PreviewDevice } from './PreviewPane'
import { PublishCeremony } from './PublishCeremony'
import { StepWelcome } from './steps/StepWelcome'
import { StepBasics } from './steps/StepBasics'
import { StepLocation } from './steps/StepLocation'
import { StepGallery } from './steps/StepGallery'
import { StepFacilities } from './steps/StepFacilities'
import { StepEquipment } from './steps/StepEquipment'
import { StepPlans } from './steps/StepPlans'
import { StepClasses } from './steps/StepClasses'
import { StepTrainers } from './steps/StepTrainers'
import { StepReviews } from './steps/StepReviews'
import { StepSocial } from './steps/StepSocial'
import { StepSeo } from './steps/StepSeo'
import { StepPreviewPublish } from './steps/StepPreviewPublish'

const STEP_LABELS = [
  'Welcome',
  'Basics',
  'Location',
  'Gallery',
  'Facilities',
  'Equipment',
  'Plans',
  'Classes',
  'Trainers',
  'Reviews',
  'Contact',
  'URL',
  'Publish',
]

function SaveChip() {
  const { saveStatus } = useBuilder()
  if (saveStatus === 'idle') return null
  return (
    <span
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] font-semibold',
        saveStatus === 'error' ? 'text-error' : 'text-muted',
      )}
    >
      {saveStatus === 'saving' && (
        <>
          <Loader2 size={13} className="animate-spin" aria-hidden /> Saving…
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <Check size={13} className="text-success animate-pop" aria-hidden /> Saved
        </>
      )}
      {saveStatus === 'error' && 'Draft too large to autosave'}
    </span>
  )
}

/** The publish gate — the four fields a professional page can't skip. */
export function missingRequired(draft: GymDraft): { label: string; step: number }[] {
  const missing: { label: string; step: number }[] = []
  if (!draft.basics.name.trim()) missing.push({ label: 'gym name', step: 1 })
  if (!draft.basics.logo) missing.push({ label: 'logo', step: 1 })
  if (!draft.location.address.trim() && !draft.location.city.trim()) missing.push({ label: 'address', step: 2 })
  if (!draft.social.phone.trim()) missing.push({ label: 'contact number', step: 10 })
  return missing
}

function BuilderShell() {
  const { draft } = useBuilder()
  const navigate = useNavigate()
  const [step, setStep] = useState(draft.basics.name ? 1 : 0)
  const [maxVisited, setMaxVisited] = useState(step)
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [phase, setPhase] = useState<'editing' | 'publishing' | 'published'>('editing')
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
  const [mobilePreview, setMobilePreview] = useState(false)
  const finalDraftRef = useRef<GymDraft | null>(null)

  const last = STEP_LABELS.length - 1
  const canContinue = step !== 1 || draft.basics.name.trim().length > 0
  const completion = completionScore(draft)

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(last, next))
    setStep(clamped)
    setMaxVisited((m) => Math.max(m, clamped))
  }

  useEffect(() => {
    document.querySelector('[data-builder-scroll]')?.scrollTo({ top: 0 })
  }, [step])

  function startPublish() {
    const slug = draft.seo.slug || slugify(draft.basics.name)
    finalDraftRef.current = {
      ...draft,
      seo: {
        ...draft.seo,
        slug,
        metaTitle: draft.seo.metaTitle || `${draft.basics.name} — ${draft.location.city || 'India'} | Gymma`,
        metaDescription: draft.seo.metaDescription || draft.basics.description.slice(0, 155),
      },
    }
    setPhase('publishing')
  }

  function finishPublish() {
    const finalDraft = finalDraftRef.current
    if (!finalDraft) return
    publishGym(finalDraft)
    setPublishedSlug(finalDraft.seo.slug)
    setPhase('published')
  }

  const stepContent = [
    <StepWelcome key="w" onBegin={() => goTo(1)} />,
    <StepBasics key="1" />,
    <StepLocation key="2" />,
    <StepGallery key="3" />,
    <StepFacilities key="4" />,
    <StepEquipment key="5" />,
    <StepPlans key="6" />,
    <StepClasses key="7" />,
    <StepTrainers key="8" />,
    <StepReviews key="9" />,
    <StepSocial key="10" />,
    <StepSeo key="11" />,
    <StepPreviewPublish
      key="12"
      device={device}
      onDevice={setDevice}
      onPublish={startPublish}
      publishing={false}
      onJump={goTo}
    />,
  ][step]

  if (phase === 'publishing') {
    return <PublishingOverlay gymName={draft.basics.name || 'your gym'} onDone={finishPublish} />
  }

  if (phase === 'published' && publishedSlug) {
    return (
      <PublishCeremony
        slug={publishedSlug}
        gymName={draft.basics.name || 'Your gym'}
        onEdit={() => {
          setPhase('editing')
          setPublishedSlug(null)
          goTo(1)
        }}
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-paper">
      {/* ---------- Top bar ---------- */}
      <header className="z-10 border-b border-line bg-paper/88 backdrop-blur-[12px]">
        <div className="flex h-[60px] items-center gap-4 px-4 md:px-6">
          <Link
            to="/"
            className="rounded-[4px] px-1 font-expanded text-[18px] font-black tracking-wide text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            GYMMA
          </Link>
          <span className="hidden text-[13px] text-muted sm:inline">
            {step === 0 ? 'Website builder' : STEP_LABELS[step]}
          </span>
          <div className="ml-auto flex items-center gap-4">
            <SaveChip />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 rounded-[4px] px-1 py-0.5 text-[13px] font-semibold text-muted transition-colors duration-(--t-fast) hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <X size={14} aria-hidden /> Save & exit
            </button>
          </div>
        </div>
        {step > 0 && (
          <WizardProgress
            labels={STEP_LABELS}
            current={step}
            maxVisited={maxVisited}
            completion={completion}
            onJump={goTo}
          />
        )}
      </header>

      {/* ---------- Body: form left, live preview right ---------- */}
      <div className="flex min-h-0 flex-1">
        <div
          data-builder-scroll
          className="min-w-0 flex-1 overflow-y-auto lg:max-w-[620px] lg:border-r lg:border-line"
        >
          <div className="px-5 py-8 pb-28 md:px-8 lg:pb-8">
            {/* enter-only step transition — exit animations can stall in
                occluded tabs and mode="wait" would trap the old step */}
            <m.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.base, ease: [...ease.outSoft] as [number, number, number, number] }}
            >
                {stepContent}

                {step > 0 && (
                  <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
                    <Button variant="secondary" onClick={() => goTo(step - 1)}>
                      <ArrowLeft size={15} aria-hidden className="mr-1" /> Back
                    </Button>
                    <div className="flex items-center gap-4">
                      {step < last && step > 1 && (
                        <Button variant="tertiary" onClick={() => goTo(step + 1)}>
                          Skip for now
                        </Button>
                      )}
                      {step < last && (
                        <Button onClick={() => goTo(step + 1)} disabled={!canContinue}>
                          Continue <ArrowRight size={15} aria-hidden className="ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
            </m.div>
          </div>
        </div>

        {/* live preview — desktop, always in view while the form scrolls */}
        <div className="hidden min-w-0 flex-1 p-5 lg:block">
          <PreviewPane device={step === last ? device : 'desktop'} />
        </div>
      </div>

      {/* ---------- Mobile: floating preview button + overlay ---------- */}
      {step > 0 && (
        <button
          type="button"
          onClick={() => setMobilePreview(true)}
          className="fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-pill bg-navy px-5 py-3.5 font-display text-[14px] font-extrabold text-white shadow-overlay transition-transform duration-(--t-fast) active:scale-[0.97] lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2"
        >
          <Eye size={16} aria-hidden /> Preview
        </button>
      )}
      {/* enter-only: exit animations can stall in occluded tabs and would
          trap the user behind a full-screen overlay */}
      {mobilePreview && (
          <m.div
            className="fixed inset-0 z-40 flex flex-col bg-navy-deep lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Website preview"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <p className="font-display text-[13px] font-extrabold uppercase tracking-wider text-dark-2">
                Your website
              </p>
              <button
                type="button"
                onClick={() => setMobilePreview(false)}
                aria-label="Close preview"
                className="grid size-10 place-items-center rounded-full text-white transition-colors duration-(--t-fast) hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-paper">
              <BuilderMobilePreview />
            </div>
          </m.div>
      )}
    </div>
  )
}

function BuilderMobilePreview() {
  const { draft } = useBuilder()
  return <GymPage gym={draft} preview />
}

export function BuilderPage() {
  return (
    <BuilderProvider>
      <BuilderShell />
    </BuilderProvider>
  )
}
