import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { buildProjectActivity, ProjectActivityList } from '../components/ProjectActivityList'
import { downloadProjectCsv } from '../lib/exportCsv'
import { Button, Card, MoneyDisplay } from '../components/Ui'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const {
    projectById,
    expensesForProject,
    collectionsForProject,
    memberNameById,
    completeProject,
    reopenProject,
    updateProject,
    deleteProject,
    deleteExpense,
    deleteCollectedMoney,
    isAdmin,
  } = useExpenseApp()
  const [editingProject, setEditingProject] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [projectError, setProjectError] = useState<string | null>(null)
  const [projectSaving, setProjectSaving] = useState(false)

  const project = projectId ? projectById(projectId) : undefined

  const expenses = useMemo(
    () => (projectId ? expensesForProject(projectId) : []),
    [projectId, expensesForProject],
  )
  const collections = useMemo(
    () => (projectId ? collectionsForProject(projectId) : []),
    [projectId, collectionsForProject],
  )

  const spent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const collected = useMemo(() => collections.reduce((s, c) => s + c.amount, 0), [collections])
  const activity = useMemo(() => buildProjectActivity(expenses, collections), [expenses, collections])

  if (!projectId || !project) {
    return <Navigate to="/app/projects" replace />
  }

  const isOngoing = project.status === 'ongoing'

  return (
    <div className="space-y-6">
      <div className="text-left">
        <Link
          to="/app/projects"
          className="text-sm font-medium text-zinc-500 transition hover:text-cyan-300"
        >
          ← Projects
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">{project.name}</h2>
            {project.summary && (
              <p className="mt-1 max-w-2xl text-sm text-zinc-400">{project.summary}</p>
            )}
          </div>
          <span
            className={
              isOngoing
                ? 'rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30'
                : 'rounded-full bg-zinc-700/50 px-3 py-1 text-xs font-medium text-zinc-400 ring-1 ring-zinc-600'
            }
          >
            {isOngoing ? 'Active' : 'Completed'}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-xl bg-zinc-900/60 px-4 py-3 ring-1 ring-zinc-800/80">
          <dt className="text-xs text-zinc-500">Collected</dt>
          <dd className="mt-1 text-lg font-semibold text-emerald-300">
            <MoneyDisplay value={collected} />
          </dd>
        </div>
        <div className="rounded-xl bg-zinc-900/60 px-4 py-3 ring-1 ring-zinc-800/80">
          <dt className="text-xs text-zinc-500">Spent</dt>
          <dd className="mt-1 text-lg font-semibold text-white">
            <MoneyDisplay value={spent} />
          </dd>
        </div>
      </dl>

      {isAdmin && (
        <Card className="border-violet-500/20 text-left">
          <h3 className="text-sm font-semibold text-white">Admin</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Edit project details, reopen completed projects, or delete this project and all its
            entries.
          </p>
          {projectError && (
            <p className="mt-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {projectError}
            </p>
          )}
          {editingProject ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                setProjectError(null)
                setProjectSaving(true)
                try {
                  await updateProject(project.id, editName, editSummary)
                  setEditingProject(false)
                } catch (err) {
                  setProjectError(err instanceof Error ? err.message : 'Could not update project.')
                } finally {
                  setProjectSaving(false)
                }
              }}
            >
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Name
                </span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-white"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Summary (optional)
                </span>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={2}
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-white"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" disabled={projectSaving}>
                  {projectSaving ? 'Saving…' : 'Save project'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={projectSaving}
                  onClick={() => setEditingProject(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditName(project.name)
                  setEditSummary(project.summary ?? '')
                  setEditingProject(true)
                  setProjectError(null)
                }}
              >
                Edit project
              </Button>
              {!isOngoing && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!confirm(`Reopen “${project.name}” as an active project?`)) return
                    setProjectError(null)
                    try {
                      await reopenProject(project.id)
                    } catch (err) {
                      setProjectError(err instanceof Error ? err.message : 'Could not reopen project.')
                    }
                  }}
                >
                  Reopen project
                </Button>
              )}
              <button
                type="button"
                onClick={async () => {
                  const hasData = expenses.length > 0 || collections.length > 0
                  const msg = hasData
                    ? `Delete “${project.name}” and all ${expenses.length} expense(s) and ${collections.length} collection(s)? This cannot be undone.`
                    : `Delete “${project.name}”? This cannot be undone.`
                  if (!confirm(msg)) return
                  setProjectError(null)
                  try {
                    await deleteProject(project.id)
                    navigate('/app/projects', { replace: true })
                  } catch (err) {
                    setProjectError(err instanceof Error ? err.message : 'Could not delete project.')
                  }
                }}
                className="inline-flex items-center justify-center rounded-xl border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
              >
                Delete project
              </button>
            </div>
          )}
        </Card>
      )}

      {isOngoing && (
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/app/projects/${project.id}/expenses/new`}
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/25"
          >
            Add expense
          </Link>
          <Link
            to={`/app/projects/${project.id}/collected/new`}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25"
          >
            Add collected
          </Link>
          {(spent > 0 || collected > 0) && (
            <button
              type="button"
              onClick={() =>
                downloadProjectCsv(project, expenses, collections, memberNameById)
              }
              className="inline-flex items-center justify-center rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Download CSV
            </button>
          )}
          {isAdmin && (
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                if (!confirm(`Mark “${project.name}” as completed?`)) return
                await completeProject(project.id)
              }}
            >
              Mark completed
            </Button>
          )}
        </div>
      )}

      {!isOngoing && (
        <div className="flex flex-wrap gap-2">
          {(spent > 0 || collected > 0) && (
            <button
              type="button"
              onClick={() =>
                downloadProjectCsv(project, expenses, collections, memberNameById)
              }
              className="inline-flex items-center justify-center rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Download CSV
            </button>
          )}
          <Link
            to={`/app/report/${project.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-cyan-500/40 hover:text-cyan-100"
          >
            View report →
          </Link>
        </div>
      )}

      <Card>
        <h3 className="mb-4 text-left text-sm font-semibold text-white">Activity</h3>
        <p className="mb-4 text-left text-xs text-zinc-500">
          All expenses and collections for this project, with who added each entry.
        </p>
        <ProjectActivityList
          activity={activity}
          memberNameById={memberNameById}
          projectId={project.id}
          isAdmin={isAdmin}
          onDelete={
            isAdmin
              ? async (row) => {
                  const label = row.kind === 'expense' ? 'expense' : 'collection'
                  if (!confirm(`Delete this ${label} “${row.title}”? This cannot be undone.`)) return
                  try {
                    if (row.kind === 'expense') {
                      await deleteExpense(row.id)
                    } else {
                      await deleteCollectedMoney(row.id)
                    }
                  } catch (err) {
                    alert(err instanceof Error ? err.message : `Could not delete ${label}.`)
                  }
                }
              : undefined
          }
          emptyMessage={
            isOngoing
              ? 'No activity yet. Add an expense or collected amount above.'
              : 'No activity recorded for this project.'
          }
        />
      </Card>
    </div>
  )
}
