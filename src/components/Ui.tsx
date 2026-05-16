import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-xl shadow-black/20 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:pointer-events-none disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 shadow-lg shadow-cyan-500/25 hover:brightness-105'
      : variant === 'secondary'
        ? 'border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800'
        : 'text-cyan-200 hover:bg-cyan-500/10'
  return (
    <button type={type} className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, id, className = '', ...rest } = props
  const inputId = id ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <label className="block text-left" htmlFor={inputId}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <input
        id={inputId}
        className={`w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${className}`}
        {...rest}
      />
    </label>
  )
}

export function MoneyDisplay({ value }: { value: number }) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
  return <span className="tabular-nums">{formatted}</span>
}
