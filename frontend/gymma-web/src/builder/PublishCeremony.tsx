import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import confetti from 'canvas-confetti'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Copy, Download, ExternalLink, Home, PartyPopper, Pencil } from 'lucide-react'
import { Button } from '../components/ui'
import { dur, ease } from '../lib/motion'

/* Gymma-palette confetti only — never rainbow. */
const BRAND_CONFETTI = ['#c46a4a', '#d98d6a', '#9c4f33', '#1f2d3d', '#faf8f5']

const riseIn = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: dur.slow, delay, ease: [...ease.outSoft] as [number, number, number, number] },
})

export function PublishCeremony({
  slug,
  gymName,
  onEdit,
}: {
  slug: string
  gymName: string
  onEdit: () => void
}) {
  const url = `${window.location.origin}/gym/${slug}`
  const [copied, setCopied] = useState(false)
  const qrWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const shot = (delay: number, opts: confetti.Options) =>
      window.setTimeout(() => confetti({ colors: BRAND_CONFETTI, disableForReducedMotion: true, ...opts }), delay)
    const timers = [
      shot(200, { particleCount: 110, spread: 80, origin: { y: 0.6 }, scalar: 1.05 }),
      shot(550, { particleCount: 55, angle: 60, spread: 60, origin: { x: 0 } }),
      shot(700, { particleCount: 55, angle: 120, spread: 60, origin: { x: 1 } }),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [])

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  function downloadQr() {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${slug}-gymma-qr.png`
    a.click()
  }

  const waShare = `https://wa.me/?text=${encodeURIComponent(`${gymName} is now on Gymma! Check out our page: ${url}`)}`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-deep">
      <div aria-hidden className="copper-glow fixed left-0 top-0 -translate-x-1/3 -translate-y-1/3" />
      <div aria-hidden className="copper-glow fixed bottom-0 right-0 translate-x-1/3 translate-y-1/3" />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <m.span
          className="mb-6 grid size-16 place-items-center rounded-full bg-copper/15 text-copper"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <PartyPopper size={28} aria-hidden />
        </m.span>

        <m.div {...riseIn(0.1)}>
          <p className="eyebrow">Website successfully published</p>
          <h1 className="mt-3 text-display text-dark-1">
            {gymName} is <span className="text-gradient-copper">live.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[44ch] text-body-l text-dark-2">
            You just launched a professional website — no code, no designer, all you. Print the QR at
            reception, share the link everywhere.
          </p>
        </m.div>

        <m.div className="mt-8 w-full rounded-md border border-copper/20 bg-navy-raised p-6" {...riseIn(0.25)}>
          <p className="break-all font-display text-[15px] font-bold text-dark-1">{url}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="on-dark" onClick={copyLink}>
              {copied ? (
                <Check size={15} aria-hidden className="mr-1.5 animate-pop" />
              ) : (
                <Copy size={15} aria-hidden className="mr-1.5" />
              )}
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
            <Link
              to={`/gym/${slug}`}
              className="inline-flex items-center gap-2 rounded-sm bg-copper px-6 py-3.5 font-display text-[15px] font-extrabold tracking-[1px] text-white transition-all duration-(--t-fast) hover:-translate-y-0.5 hover:bg-copper-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
            >
              <ExternalLink size={15} aria-hidden /> Open website
            </Link>
            <a
              href={waShare}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-sm border-[1.5px] border-white/40 px-6 py-3.5 font-display text-[15px] font-extrabold tracking-[1px] text-white transition-colors duration-(--t-fast) hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              Share on WhatsApp
            </a>
          </div>
        </m.div>

        <m.div className="mt-6 flex flex-col items-center gap-4" {...riseIn(0.4)}>
          <div ref={qrWrapRef} className="rounded-md bg-white p-4 shadow-lg">
            <QRCodeCanvas value={url} size={160} fgColor="#1f2d3d" />
          </div>
          <button
            type="button"
            onClick={downloadQr}
            className="inline-flex items-center gap-2 rounded-[4px] px-1 text-[14px] font-semibold text-copper transition-colors duration-(--t-fast) hover:text-copper-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <Download size={15} aria-hidden /> Download QR for your reception desk
          </button>
        </m.div>

        <m.div className="mt-10 flex flex-wrap items-center justify-center gap-6" {...riseIn(0.55)}>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-[4px] px-1 text-[14px] font-semibold text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <Pencil size={14} aria-hidden /> Edit website
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[4px] px-1 text-[14px] font-semibold text-dark-2 transition-colors duration-(--t-fast) hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <Home size={14} aria-hidden /> Return to dashboard
          </Link>
        </m.div>
      </div>
    </div>
  )
}
