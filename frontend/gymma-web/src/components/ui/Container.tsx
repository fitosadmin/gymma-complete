import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** `default` = 1200px content container; `prose` = 720px reading column (D4) */
  width?: 'default' | 'prose'
}

/** Layout container — 1200px max, 20px pad mobile / 40px / 48px desktop-wide (D4/D5). */
export function Container({ width = 'default', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 lg:px-10 xl:px-12',
        width === 'default' ? 'max-w-[1296px]' : 'max-w-[816px]',
        className,
      )}
      {...props}
    />
  )
}
