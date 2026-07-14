import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface AccordionItem {
  id: string
  title: string
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  /** Index open by default; null = all closed */
  defaultOpen?: number | null
  className?: string
}

/*
 * D3 P7 accordion: single-open, 250ms height ease, real buttons + regions.
 * Height animates via the grid-rows 0fr→1fr technique (transform-free, cheap).
 */
export function Accordion({ items, defaultOpen = 0, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(
    defaultOpen === null ? null : (items[defaultOpen]?.id ?? null),
  )
  const baseId = useId()

  return (
    <div className={cn('divide-y divide-line rounded-md border border-line bg-card', className)}>
      {items.map((item) => {
        const open = openId === item.id
        const headerId = `${baseId}-${item.id}-header`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={headerId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 px-6 py-5 text-left',
                  'font-display text-[16px] font-bold text-ink',
                  'transition-colors duration-(--t-fast) hover:text-copper-dark',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-inset',
                )}
              >
                {item.title}
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={cn(
                    'shrink-0 text-muted transition-transform duration-(--t-base) ease-in-out-smooth',
                    open && 'rotate-180',
                  )}
                />
              </button>
            </h3>
            <div
              role="region"
              id={panelId}
              aria-labelledby={headerId}
              className="grid transition-[grid-template-rows] duration-(--t-base) ease-in-out-smooth"
              style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-5 text-[15px] leading-relaxed text-muted">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
