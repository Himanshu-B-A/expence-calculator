import { Link } from 'react-router-dom'
import type { CollectedMoney, Expense, Project } from '../types'
import { Card, MoneyDisplay } from './Ui'

export type ActivityRow = {
  id: string
  kind: 'expense' | 'collected'
  title: string
  amount: number
  recordedAt: string
  createdBy?: string
  meta?: string
}

type Props = {
  projects: Project[]
  expensesForProject: (id: string) => Expense[]
  collectionsForProject: (id: string) => CollectedMoney[]
  memberNameById: (uid?: string) => string
  spentByProject: Map<string, number>
  collectedByProject: Map<string, number>
  isAdmin: boolean
  onComplete: (projectId: string, name: string) => void
  onDownload: (project: Project) => void
}

function buildActivityRows(
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

export function OngoingActivityView({
  projects,
  expensesForProject,
  collectionsForProject,
  memberNameById,
  spentByProject,
  collectedByProject,
  isAdmin,
  onComplete,
  onDownload,
}: Props) {
  return (
    <div className="space-y-6">
      {projects.map((p) => {
        const spent = spentByProject.get(p.id) ?? 0
        const collected = collectedByProject.get(p.id) ?? 0
        const projectExpenses = expensesForProject(p.id)
        const projectCollections = collectionsForProject(p.id)
        const activity = buildActivityRows(projectExpenses, projectCollections)

        return (
          <Card key={p.id} className="text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                {p.summary && <p className="mt-1 text-sm text-zinc-400">{p.summary}</p>}
                <dl className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-zinc-500">Collected</dt>
                    <dd className="font-semibold text-emerald-300">
                      <MoneyDisplay value={collected} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Spent</dt>
                    <dd className="font-semibold text-white">
                      <MoneyDisplay value={spent} />
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/app/projects/${p.id}/expenses/new`}
                  className="inline-flex items-center rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-500/30 hover:bg-cyan-500/25"
                >
                  + Expense
                </Link>
                <Link
                  to={`/app/projects/${p.id}/collected/new`}
                  className="inline-flex items-center rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                >
                  + Collected
                </Link>
                {(spent > 0 || collected > 0) && (
                  <button
                    type="button"
                    onClick={() => onDownload(p)}
                    className="inline-flex items-center rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    Download CSV
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onComplete(p.id, p.name)}
                    className="inline-flex items-center rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    Mark completed
                  </button>
                )}
              </div>
            </div>

            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No expenses or collections yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-800">
                {activity.map((row) => (
                  <li
                    key={`${row.kind}-${row.id}`}
                    className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0"
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
            )}
          </Card>
        )
      })}
    </div>
  )
}
