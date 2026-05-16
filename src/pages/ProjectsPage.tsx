import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { Button, Card, MoneyDisplay } from '../components/Ui'

type Tab = 'ongoing' | 'completed'

export function ProjectsPage() {
  const {
    projects,
    expenses,
    collections,
    addProject,
    isAdmin,
  } = useExpenseApp()
  const [tab, setTab] = useState<Tab>('ongoing')
  const [newName, setNewName] = useState('')
  const [newSummary, setNewSummary] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const createPanelOpen = isAdmin && showCreate

  const filtered = useMemo(
    () => projects.filter((p) => p.status === tab),
    [projects, tab],
  )

  const totalsByProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      map.set(e.projectId, (map.get(e.projectId) ?? 0) + e.amount)
    }
    return map
  }, [expenses])

  const collectedByProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of collections) {
      map.set(c.projectId, (map.get(c.projectId) ?? 0) + c.amount)
    }
    return map
  }, [collections])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await addProject(newName, newSummary)
    setNewName('')
    setNewSummary('')
    setShowCreate(false)
    setTab('ongoing')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Projects</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Track ongoing spend and archive completed work. Open a project to add entries and see
            who added each expense or collection.
            {!isAdmin && (
              <span className="mt-2 block text-violet-200/90">
                You are signed in as a team member — only an admin can create projects or mark them
                completed.
              </span>
            )}
          </p>
        </div>
        {isAdmin && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowCreate((v) => !v)}
            className="shrink-0"
          >
            {showCreate ? 'Close form' : '+ New project'}
          </Button>
        )}
      </div>

      {createPanelOpen && (
        <Card className="border-cyan-500/20">
          <h3 className="mb-4 text-left text-sm font-semibold text-white">Create project</h3>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-left sm:col-span-2" htmlFor="proj-name">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Name
              </span>
              <input
                id="proj-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Website redesign"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <label className="block text-left sm:col-span-2" htmlFor="proj-sum">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Summary (optional)
              </span>
              <input
                id="proj-sum"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Short context for your team"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary">
                Save project
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-1.5">
        {(
          [
            ['ongoing', 'Ongoing'],
            ['completed', 'Completed'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none',
              tab === key
                ? 'bg-zinc-800 text-white shadow-inner ring-1 ring-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center text-zinc-500">
          No {tab} projects yet.{' '}
          {tab === 'ongoing'
            ? isAdmin
              ? 'Create one above.'
              : 'Ask an admin to create a project.'
            : isAdmin
              ? 'Mark an active project as completed.'
              : 'An admin must mark active projects as completed before they appear here.'}
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => {
            const spent = totalsByProject.get(p.id) ?? 0
            const collected = collectedByProject.get(p.id) ?? 0
            return (
              <li key={p.id}>
                <Card className="flex h-full flex-col text-left transition hover:border-cyan-500/25">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/app/projects/${p.id}`}
                        className="text-lg font-semibold text-white transition hover:text-cyan-200"
                      >
                        {p.name}
                      </Link>
                      {p.summary && (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{p.summary}</p>
                      )}
                    </div>
                    <span
                      className={
                        p.status === 'ongoing'
                          ? 'shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'shrink-0 rounded-full bg-zinc-700/50 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-zinc-600'
                      }
                    >
                      {p.status === 'ongoing' ? 'Active' : 'Done'}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-zinc-950/50 px-3 py-2 ring-1 ring-zinc-800/80">
                      <dt className="text-xs text-zinc-500">Collected</dt>
                      <dd className="mt-0.5 font-semibold text-emerald-300">
                        <MoneyDisplay value={collected} />
                      </dd>
                    </div>
                    <div className="rounded-xl bg-zinc-950/50 px-3 py-2 ring-1 ring-zinc-800/80">
                      <dt className="text-xs text-zinc-500">Spent</dt>
                      <dd className="mt-0.5 font-semibold text-white">
                        <MoneyDisplay value={spent} />
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-5">
                    <Link
                      to={`/app/projects/${p.id}`}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500/15 px-3 py-2.5 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/25"
                    >
                      Open project →
                    </Link>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
