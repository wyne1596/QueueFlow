import { X, Inbox } from 'lucide-react'
import { useEffect, type ComponentProps, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx, initials } from './lib'

export const field = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20'

export function Card({ className, ...p }: ComponentProps<'div'>) {
  return <div className={cx('rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]', className)} {...p} />
}

const variants = {
  primary: 'bg-teal text-white hover:bg-teal-600 border-transparent',
  navy: 'bg-navy text-white hover:bg-navy-700 border-transparent',
  secondary: 'bg-white text-ink border-line hover:bg-slate-50',
  danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-slate-100 hover:text-ink',
}
export function Button({ variant = 'secondary', size = 'md', className, ...p }: ComponentProps<'button'> & { variant?: keyof typeof variants; size?: 'sm' | 'md' }) {
  return (
    <button
      className={cx('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-45 disabled:hover:bg-inherit', size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm', variants[variant], className)}
      {...p}
    />
  )
}

const tones: Record<string, string> = {
  Waiting: 'bg-amber-50 text-amber-700 ring-amber-200', Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Called: 'bg-blue-50 text-blue-700 ring-blue-200', 'In Service': 'bg-teal-50 text-teal ring-teal/30',
  'Not Started': 'bg-slate-100 text-slate-600 ring-slate-200', 'In Progress': 'bg-blue-50 text-blue-700 ring-blue-200', Ready: 'bg-amber-50 text-amber-700 ring-amber-200', Received: 'bg-emerald-50 text-emerald-700 ring-emerald-200', 'Not Arrived': 'bg-slate-100 text-slate-600 ring-slate-200', 'Being Served': 'bg-teal-50 text-teal ring-teal/30', Departed: 'bg-slate-100 text-slate-600 ring-slate-200',
  Confirmed: 'bg-teal-50 text-teal ring-teal/30', Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Skipped: 'bg-slate-100 text-slate-600 ring-slate-200', Cancelled: 'bg-red-50 text-red-600 ring-red-200',
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Busy: 'bg-teal-50 text-teal ring-teal/30', Away: 'bg-slate-100 text-slate-600 ring-slate-200',
}
export function Badge({ children, tone }: { children: string; tone?: string }) {
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone ?? children] ?? 'bg-slate-100 text-slate-600 ring-slate-200')}>{children}</span>
}

export function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5
  const bg = ['bg-teal-50 text-teal', 'bg-blue-50 text-blue-700', 'bg-amber-50 text-amber-700', 'bg-violet-50 text-violet-700', 'bg-rose-50 text-rose-700'][hue]
  return <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold', bg)} style={{ width: size * 4, height: size * 4 }}>{initials(name)}</span>
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('pop flex max-h-[90dvh] w-full flex-col rounded-xl bg-white shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-teal' : 'bg-slate-300')}>
      <span className={cx('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} />
    </button>
  )
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
      <Inbox size={26} className="text-slate-300" />
      {text}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
      {items.map((i) => (
        <button key={i.id} onClick={() => onChange(i.id)} className={cx('rounded-md px-3 py-1.5 text-sm font-medium transition', value === i.id ? 'bg-navy text-white' : 'text-muted hover:text-ink')}>
          {i.label}{i.count !== undefined && <span className={cx('ml-1.5 text-xs', value === i.id ? 'text-white/70' : 'text-slate-400')}>{i.count}</span>}
        </button>
      ))}
    </div>
  )
}

export const Th = ({ children, className }: { children?: ReactNode; className?: string }) => <th className={cx('px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted', className)}>{children}</th>
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cx('px-4 py-3 text-sm', className)}>{children}</td>
