import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { springSettle } from '../../lib/motion'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Sticky action bar pinned to the sheet bottom (e.g. filter apply — D5) */
  footer?: ReactNode
}

/*
 * Bottom sheet (D5 gestures/G2 filters): spring in, scrim tap + Esc close,
 * focus trapped, body scroll locked. Drag-to-dismiss physics arrives with
 * the /gyms filter work in Phase 5 — the dialog contract is complete here.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    panel?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <m.div
            aria-hidden
            className="absolute inset-0 bg-navy-deep/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-[85vh] w-full flex-col bg-card shadow-overlay outline-none',
              'rounded-t-lg sm:max-w-lg sm:rounded-lg',
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springSettle}
          >
            {/* drag handle affordance (mobile) */}
            <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-pill bg-line sm:hidden" />
            <div className="flex items-center justify-between px-6 pb-2 pt-4">
              <h2 className="text-h3 text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors duration-(--t-fast) hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="overflow-y-auto px-6 pb-6">{children}</div>
            {footer && <div className="border-t border-line bg-card px-6 py-4">{footer}</div>}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}
