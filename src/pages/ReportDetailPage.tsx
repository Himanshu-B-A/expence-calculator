import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { downloadProjectCsv } from '../lib/exportCsv'
import { Button, Card, MoneyDisplay } from '../components/Ui'

const tooltipStyle = {
  backgroundColor: 'rgba(24, 24, 27, 0.95)',
  border: '1px solid rgba(63, 63, 70, 0.9)',
  borderRadius: '12px',
  color: '#f4f4f5',
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleString(undefined, { month: 'short', year: 'numeric' })
}

export function ReportDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { projectById, expensesForProject, collectionsForProject, memberNameById } = useExpenseApp()
  const project = projectId ? projectById(projectId) : undefined
  const list = useMemo(
    () => (projectId ? expensesForProject(projectId) : []),
    [projectId, expensesForProject],
  )
  const collectedList = useMemo(
    () => (projectId ? collectionsForProject(projectId) : []),
    [projectId, collectionsForProject],
  )

  const byTitle = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of list) {
      const label = e.title.length > 28 ? `${e.title.slice(0, 26)}…` : e.title
      map.set(label, (map.get(label) ?? 0) + e.amount)
    }
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [list])

  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; total: number; entries: number }>()
    for (const e of list) {
      const key = e.recordedAt.slice(0, 7)
      const cur = map.get(key) ?? { month: key, total: 0, entries: 0 }
      cur.total += e.amount
      cur.entries += 1
      map.set(key, cur)
    }
    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((row) => ({
        ...row,
        label: formatMonthLabel(row.month),
      }))
  }, [list])

  if (!projectId || !project) {
    return <Navigate to="/app/report" replace />
  }

  if (project.status !== 'completed') {
    return <Navigate to="/app/report" replace />
  }

  const spentTotal = list.reduce((s, e) => s + e.amount, 0)
  const collectedTotal = collectedList.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 text-left sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/app/report" className="text-sm font-medium text-cyan-300/90 hover:text-cyan-200">
            ← All completed projects
          </Link>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{project.name}</h2>
          {project.summary && <p className="mt-1 text-sm text-zinc-400">{project.summary}</p>}
          <dl className="mt-4 flex flex-wrap gap-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Collected</dt>
              <dd className="mt-1 text-xl font-semibold text-emerald-300">
                <MoneyDisplay value={collectedTotal} />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Spent</dt>
              <dd className="mt-1 text-xl font-semibold text-white">
                <MoneyDisplay value={spentTotal} />
              </dd>
            </div>
          </dl>
        </div>
        {(list.length > 0 || collectedList.length > 0) && (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={() => downloadProjectCsv(project, list, collectedList, memberNameById)}
          >
            Download CSV
          </Button>
        )}
      </div>

      {list.length === 0 && collectedList.length === 0 ? (
        <Card className="py-12 text-center text-zinc-500">
          No expenses or collections recorded for this project.
        </Card>
      ) : (
        <>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="min-h-[340px]">
            <h3 className="mb-1 text-left text-sm font-semibold text-white">Spend by line item</h3>
            <p className="mb-4 text-left text-xs text-zinc-500">Amounts grouped by expense title</p>
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byTitle} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <defs>
                    <linearGradient id="barGradA" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat(undefined, {
                        notation: 'compact',
                        compactDisplay: 'short',
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(Number(v))
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: '#d4d4d8', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(34, 211, 238, 0.06)' }}
                    contentStyle={tooltipStyle}
                    formatter={(value) => {
                      const n = typeof value === 'number' ? value : Number(value)
                      return [
                        new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: 'INR',
                        }).format(n),
                        'Amount',
                      ]
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} fill="url(#barGradA)" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="min-h-[340px]">
            <h3 className="mb-1 text-left text-sm font-semibold text-white">Entries & totals over time</h3>
            <p className="mb-4 text-left text-xs text-zinc-500">
              Monthly entry count with cumulative spend curve
            </p>
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byMonth} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    label={{
                      value: 'Entries',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#71717a',
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat(undefined, {
                        notation: 'compact',
                        compactDisplay: 'short',
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(Number(v))
                    }
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    formatter={(value) => <span className="text-zinc-300">{value}</span>}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="entries"
                    name="Entries"
                    fill="rgba(34, 211, 238, 0.35)"
                    stroke="rgba(34, 211, 238, 0.9)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total"
                    name="Monthly total"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#34d399' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card className="mt-6">
          <h3 className="mb-3 text-left text-sm font-semibold text-white">Expense entries</h3>
          <ul className="divide-y divide-zinc-800 text-left text-sm">
            {[...list]
              .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
              .map((e) => (
                <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-white">{e.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {e.recordedAt}
                      {e.category ? ` · ${e.category}` : ''}
                      {e.vendor ? ` · ${e.vendor}` : ''}
                      {e.paymentMethod ? ` · ${e.paymentMethod.replace('_', ' ')}` : ''}
                    </p>
                    {e.notes && <p className="mt-1 text-xs text-zinc-400">{e.notes}</p>}
                    <p className="mt-1 text-xs text-violet-300/90">
                      Added by {memberNameById(e.createdBy)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      <MoneyDisplay value={e.amount} />
                    </p>
                    {e.receiptImageUrl && (
                      <a
                        href={e.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-cyan-300 hover:text-cyan-200"
                      >
                        View receipt
                      </a>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </Card>
        {collectedList.length > 0 && (
          <Card className="mt-6">
            <h3 className="mb-3 text-left text-sm font-semibold text-white">Collected money</h3>
            <ul className="divide-y divide-zinc-800 text-left text-sm">
              {[...collectedList]
                .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
                .map((c) => (
                  <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-white">{c.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {c.recordedAt}
                        {c.receivedFrom ? ` · from ${c.receivedFrom}` : ''}
                      </p>
                      {c.notes && <p className="mt-1 text-xs text-zinc-400">{c.notes}</p>}
                      <p className="mt-1 text-xs text-violet-300/90">
                        Added by {memberNameById(c.createdBy)}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-300">
                      <MoneyDisplay value={c.amount} />
                    </p>
                  </li>
                ))}
            </ul>
          </Card>
        )}
        </>
      )}
    </div>
  )
}
