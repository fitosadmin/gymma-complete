import { forwardRef, useId } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Check, ChevronDown, CircleAlert } from 'lucide-react'
import { cn } from '../../lib/cn'

/*
 * D8.7 inputs: height 52px, radius 14, white bg, 1px line border, 16px Inter.
 * Label above, ALWAYS visible (never placeholder-only — GP12 a11y rule).
 * Focus: copper border + 3px copper/12 ring. Error/success in-field.
 */

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  success?: boolean
  id: string
  children: ReactNode
}

function FieldShell({ label, hint, error, id, children }: FieldShellProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block font-display text-[13px] font-bold text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-[13px] text-error">
          <CircleAlert size={14} aria-hidden />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

const controlBase = cn(
  'w-full rounded-sm border bg-white font-body text-base text-ink placeholder:text-muted',
  'transition-[border-color,box-shadow] duration-(--t-fast)',
  'focus:outline-none focus:border-copper focus:ring-[3px] focus:ring-copper/12',
  'disabled:opacity-40 disabled:pointer-events-none',
)

function controlState(error?: string) {
  return error ? 'border-error focus:border-error focus:ring-error/12' : 'border-line'
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

/* --- Input --- */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  success?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, success, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={cn(controlBase, controlState(error), 'h-[52px] px-4', success && 'pr-11', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...props}
        />
        {success && !error && (
          <Check
            size={18}
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-success"
          />
        )}
      </div>
    </FieldShell>
  )
})

/* --- Textarea --- */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <textarea
        ref={ref}
        id={id}
        rows={4}
        className={cn(controlBase, controlState(error), 'px-4 py-3.5', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  )
})

/* --- Select --- */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id: idProp, children, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(controlBase, controlState(error), 'h-[52px] appearance-none px-4 pr-11', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={18}
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </FieldShell>
  )
})

/* --- Checkbox: 20px, radius 6, copper-filled when checked --- */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-3', className)}>
      <span className="relative inline-flex">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={cn(
            'peer size-5 appearance-none rounded-[6px] border border-line bg-white',
            'transition-colors duration-(--t-fast) checked:border-copper checked:bg-copper',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
          {...props}
        />
        <Check
          size={14}
          strokeWidth={3}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-(--t-fast) peer-checked:opacity-100"
        />
      </span>
      <span className="text-[15px] text-ink">{label}</span>
    </label>
  )
})

/* --- Toggle: 44×24 track, copper on-state --- */
export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  label: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { label, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-3', className)}>
      <span className="relative inline-flex">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={id}
          className={cn(
            'peer h-6 w-11 appearance-none rounded-pill border border-line bg-line/60',
            'transition-colors duration-(--t-base) checked:border-copper checked:bg-copper',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-[3px] top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-(--t-base) ease-out-soft peer-checked:translate-x-5"
        />
      </span>
      <span className="text-[15px] text-ink">{label}</span>
    </label>
  )
})
