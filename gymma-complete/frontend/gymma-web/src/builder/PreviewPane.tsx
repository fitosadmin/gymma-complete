import { useCallback, useEffect, useRef, useState } from 'react'
import { GymPage } from '../gym/GymPage'
import { useBuilder } from './store'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

const DEVICE_WIDTH: Record<PreviewDevice, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
}

/**
 * "The Website You Are Building" — renders the REAL GymPage template
 * from the live draft, scaled to fit whatever pane it sits in.
 * One template, one source of truth: what you see IS what publishes.
 */
export function PreviewPane({ device }: { device: PreviewDevice }) {
  const { draft } = useBuilder()
  const outerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  const measure = useCallback(() => {
    const el = outerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setBox((prev) => (prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }))
  }, [])

  useEffect(() => {
    measure()
    const el = outerRef.current
    if (!el) return
    // RO alone misses the display:none → visible transition when the pane
    // mounts below the lg breakpoint, so window resize backs it up
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const deviceW = DEVICE_WIDTH[device]
  const scale = box.w > 0 ? Math.min(1, box.w / deviceW) : 0
  const innerH = scale > 0 ? box.h / scale : 0

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="font-display text-[12px] font-extrabold uppercase tracking-wider text-muted">
          The website you are building
        </p>
        <p className="text-caption text-muted">{deviceW}px</p>
      </div>
      <div
        ref={outerRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-line bg-navy-deep/5 shadow-md"
      >
        {scale > 0 && (
          <div
            className="absolute left-1/2 top-0 origin-top overflow-y-auto bg-paper transition-[width,transform] duration-(--t-slow) ease-in-out-smooth"
            style={{
              width: deviceW,
              height: innerH,
              transform: `translateX(-50%) scale(${scale})`,
            }}
          >
            <GymPage gym={draft} preview />
          </div>
        )}
      </div>
    </div>
  )
}
