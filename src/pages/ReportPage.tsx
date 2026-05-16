import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { downloadAllProjectsCsv } from '../lib/exportCsv'
import { Button, Card, MoneyDisplay } from '../components/Ui'

export function ReportPage() {
  const { projects, expenses, collections, isAdmin } = useExpenseApp()

  const completed = useMemo(
    () => projects.filter((p) => p.status === 'completed'),
    [projects],
  )

  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      map.set(e.projectId, (map.get(e.projectId) ?? 0) + e.amount)
    }
    return map
  }, [expenses])

  const collectedTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of collections) {
      map.set(c.projectId, (map.get(c.projectId) ?? 0) + c.amount)
    }
    return map
  }, [collections])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 text-left sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Report</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Pick a completed project to see collected vs spent, charts, and download a CSV.
          </p>
        </div>
        {completed.length > 0 && (expenses.length > 0 || collections.length > 0) && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadAllProjectsCsv(projects, expenses, collections)}
          >
            Download all CSV
          </Button>
        )}
      </div>

      {completed.length === 0 ? (
        <Card className="py-16 text-center text-zinc-500">
          No completed projects yet.{' '}
          {isAdmin
            ? 'Mark a project done from the Projects tab to unlock reporting.'
            : 'An admin must mark a project completed before it appears here for reporting.'}
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {completed.map((p) => {
            const spent = totals.get(p.id) ?? 0
            const collected = collectedTotals.get(p.id) ?? 0
            return (
              <li key={p.id}>
                <Link to={`/app/report/${p.id}`} className="block h-full">
                  <Card className="h-full text-left transition hover:border-cyan-500/30 hover:shadow-cyan-500/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                        {p.summary && (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{p.summary}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-200 ring-1 ring-cyan-500/25">
                        Report
                      </span>
                    </div>
                    <dl className="mt-4 flex flex-wrap gap-4 text-sm">
                      <div>
                        <dt className="text-xs text-zinc-500">Collected</dt>
                        <dd className="mt-0.5 font-semibold text-emerald-300">
                          <MoneyDisplay value={collected} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-zinc-500">Spent</dt>
                        <dd className="mt-0.5 font-semibold text-white">
                          <MoneyDisplay value={spent} />
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-sm font-medium text-cyan-300/90">Open graphs →</p>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
