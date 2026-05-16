import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { Button, Card, TextInput } from '../components/Ui'

export function EditCollectedPage() {
  const { projectId, collectionId } = useParams<{ projectId: string; collectionId: string }>()
  const { projectById, collectionById, updateCollectedMoney, isAdmin } = useExpenseApp()
  const navigate = useNavigate()
  const project = projectId ? projectById(projectId) : undefined
  const collection = collectionId ? collectionById(collectionId) : undefined

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const [receivedFrom, setReceivedFrom] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!collection || loaded) return
    setTitle(collection.title)
    setAmount(String(collection.amount))
    setRecordedAt(collection.recordedAt)
    setReceivedFrom(collection.receivedFrom ?? '')
    setNotes(collection.notes ?? '')
    setLoaded(true)
  }, [collection, loaded])

  if (!isAdmin) {
    return <Navigate to="/app/projects" replace />
  }

  if (!projectId || !project || !collectionId || !collection || collection.projectId !== projectId) {
    return <Navigate to={`/app/projects/${projectId ?? ''}`} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const n = Number.parseFloat(amount)
    if (!title.trim() || Number.isNaN(n) || n <= 0) return
    setSaving(true)
    try {
      await updateCollectedMoney(collection.id, {
        title: title.trim(),
        amount: n,
        recordedAt,
        receivedFrom: receivedFrom.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      navigate(`/app/projects/${project.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update collection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-left">
        <Link
          to={`/app/projects/${project.id}`}
          className="text-sm font-medium text-cyan-300/90 hover:text-cyan-200"
        >
          ← Back to project
        </Link>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Edit collection</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {project.name} · <span className="text-violet-300/90">Admin only</span>
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <TextInput label="Description" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Amount (INR)"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <TextInput
              label="Date received"
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              required
            />
          </div>
          <TextInput
            label="Received from (optional)"
            value={receivedFrom}
            onChange={(e) => setReceivedFrom(e.target.value)}
          />
          <label className="block" htmlFor="edit-col-notes">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Notes (optional)
            </span>
            <textarea
              id="edit-col-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
