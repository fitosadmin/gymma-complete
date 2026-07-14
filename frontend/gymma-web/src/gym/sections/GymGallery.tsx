import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { Camera, ChevronLeft, ChevronRight, Dumbbell, Users, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { GymDraft } from '../../builder/types'
import { ActHeader, AsideStat, FadeImage, rise } from '../shared'

/*
 * Act 3 — magazine gallery: a deterministic editorial pattern
 * (tall lead, offset pair, wide closer), hover pan-zoom, lightbox.
 */

const SPANS = [
  'md:col-span-7 md:row-span-2 aspect-[4/3] md:aspect-auto',
  'md:col-span-5 aspect-[16/10]',
  'md:col-span-5 aspect-[16/10]',
  'md:col-span-4 aspect-square',
  'md:col-span-4 aspect-square',
  'md:col-span-4 aspect-square',
]

export function GymGallery({ gym, preview }: { gym: GymDraft; preview: boolean }) {
  const { gallery } = gym
  const name = gym.basics.name || 'the gym'
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? null : (i + 1) % gallery.length))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length))
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [lightbox, gallery.length])

  return (
    <section id="gallery" className="scroll-mt-14 bg-paper pb-20 md:pb-28">
      <div className="mx-auto max-w-[1296px] px-5 md:px-10 xl:px-12">
        <m.div {...rise(0)}>
          <ActHeader
            index="02"
            eyebrow="Inside"
            title={<>Step inside.</>}
            kicker="Photos are the second-best proof after verified reviews. The best is walking in."
            aside={
              gallery.length > 0 ? (
                <AsideStat value={gallery.length} label={gallery.length === 1 ? 'photo · tap to view' : 'photos · tap to view'} />
              ) : undefined
            }
          />
        </m.div>

        {gallery.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
            {gallery.slice(0, 6).map((img, i) => (
              <m.button
                key={img.id}
                type="button"
                onClick={preview ? undefined : () => setLightbox(i)}
                aria-label={`View photo: ${img.category}`}
                className={cn(
                  'group relative overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
                  i === 0 && 'col-span-2',
                  SPANS[i],
                )}
                {...rise(0.05 + i * 0.06, 18)}
              >
                <FadeImage
                  src={img.dataUrl}
                  alt={`${img.category} — ${name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[700ms] ease-out-soft group-hover:scale-[1.05]"
                />
                <span className="absolute bottom-3 left-3 rounded-pill bg-navy-deep/70 px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-wider text-dark-2 opacity-0 transition-opacity duration-(--t-base) group-hover:opacity-100">
                  {img.category}
                </span>
              </m.button>
            ))}
          </div>
        ) : (
          <div className="mt-12">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[Camera, Dumbbell, Users].map((Icon, i) => (
                <m.div
                  key={i}
                  className={cn('grid place-items-center rounded-md text-copper/60', i === 0 ? 'aspect-[4/3]' : 'aspect-[4/3]')}
                  style={{ backgroundImage: 'var(--gradient-icon-tile)' }}
                  {...rise(0.05 + i * 0.07)}
                >
                  <Icon size={28} aria-hidden />
                </m.div>
              ))}
            </div>
            <p className="mt-4 text-caption text-muted">Photos coming soon — drop by and see the space in person.</p>
          </div>
        )}
      </div>

      {/* lightbox — enter-only, instant close */}
      {lightbox !== null && gallery[lightbox] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/95 p-4"
          onClick={() => setLightbox(null)}
        >
          <m.figure
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[86vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={gallery[lightbox].dataUrl}
              alt={gallery[lightbox].category}
              className="max-h-[86vh] w-auto rounded-md object-contain"
            />
            <figcaption className="mt-3 flex items-center justify-between text-[13px] text-dark-2">
              <span>{gallery[lightbox].category}</span>
              <span>{lightbox + 1} / {gallery.length}</span>
            </figcaption>
          </m.figure>
          <button
            type="button"
            aria-label="Close photo viewer"
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors duration-(--t-fast) hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <X size={20} aria-hidden />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! - 1 + gallery.length) % gallery.length) }}
                className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors duration-(--t-fast) hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                <ChevronLeft size={20} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! + 1) % gallery.length) }}
                className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors duration-(--t-fast) hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                <ChevronRight size={20} aria-hidden />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
