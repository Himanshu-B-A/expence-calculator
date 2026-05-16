import type { CollectedMoney, Expense } from '../types'
import { MoneyDisplay } from './Ui'

export type ActivityRow = {
  id: string
  kind: 'expense' | 'collected'
  title: string
  amount: number
  recordedAt: string
  createdBy?: string
  meta?: string
  receiptImageUrl?: string
}

export function buildProjectActivity(
  expenses: Expense[],
  collections: CollectedMoney[],
): ActivityRow[] {
  const rows: ActivityRow[] = [
    ...expenses.map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      title: e.title,
      amount: e.amount,
      recordedAt: e.recordedAt,
      createdBy: e.createdBy,
      meta: [e.category, e.vendor].filter(Boolean).join(' · ') || undefined,
      receiptImageUrl: e.receiptImageUrl,
    })),
    ...collections.map((c) => ({
      id: c.id,
      kind: 'collected' as const,
      title: c.title,
      amount: c.amount,
      recordedAt: c.recordedAt,
      createdBy: c.createdBy,
      meta: c.receivedFrom ? `from ${c.receivedFrom}` : undefined,
    })),
  ]
  return rows.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
}

type Props = {
  activity: ActivityRow[]
  memberNameById: (uid?: string) => string
  emptyMessage?: string
}

export function ProjectActivityList({
  activity,
  memberNameById,
  emptyMessage = 'No expenses or collections yet.',
}: Props) {
  if (activity.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y divide-zinc-800">
      {activity.map((row) => (
        <li
          key={`${row.kind}-${row.id}`}
          className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  row.kind === 'expense'
                    ? 'rounded-md bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-200'
                    : 'rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-200'
                }
              >
                {row.kind === 'expense' ? 'Expense' : 'Collected'}
              </span>
              <span className="text-sm font-medium text-white">{row.title}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {row.recordedAt}
              {row.meta ? ` · ${row.meta}` : ''}
            </p>
            <p className="mt-1 text-xs text-violet-300/90">
              Added by {memberNameById(row.createdBy)}
            </p>
            {row.receiptImageUrl && (
              <a
                href={row.receiptImageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-medium text-cyan-300 hover:text-cyan-200"
              >
                View receipt
              </a>
            )}
          </div>
          <p
            className={`shrink-0 font-semibold tabular-nums ${row.kind === 'collected' ? 'text-emerald-300' : 'text-white'}`}
          >
            {row.kind === 'collected' ? '+' : '−'}
            <MoneyDisplay value={row.amount} />
          </p>
        </li>
      ))}
    </ul>
  )
}
