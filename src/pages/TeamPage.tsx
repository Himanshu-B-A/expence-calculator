import { useState } from 'react'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { Button, Card } from '../components/Ui'

export function TeamPage() {
  const { teamMembers, addPerson, isAdmin } = useExpenseApp()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const n = displayName.trim()
    const em = email.trim().toLowerCase()
    const pw = password
    if (!n || !em || !pw) {
      setFormError('Enter full name, email, and password.')
      return
    }
    if (teamMembers.some((m) => m.email.toLowerCase() === em)) {
      setFormError('That email is already on the roster.')
      return
    }
    setSaving(true)
    const result = await addPerson({ displayName: n, email: em, password: pw })
    setSaving(false)
    if (!result.ok) {
      setFormError(result.error ?? 'Could not add this person.')
      return
    }
    setDisplayName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="space-y-8">
      <div className="text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Team</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Admins create Firebase accounts for each teammate (email + password). Those credentials are
          used on the sign-in page. Profiles are stored in Firestore.
        </p>
        {!isAdmin && (
          <p className="mt-2 text-sm text-violet-200/90">
            You are signed in as a team member — contact an admin to add someone new.
          </p>
        )}
      </div>

      {isAdmin && (
        <Card className="border-violet-500/20">
          <h3 className="mb-4 text-left text-sm font-semibold text-white">Add person</h3>
          {formError && (
            <div className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {formError}
            </div>
          )}
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-left sm:col-span-2" htmlFor="person-name">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Full name
              </span>
              <input
                id="person-name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  setFormError(null)
                }}
                placeholder="e.g. Jamie Rivera"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <label className="block text-left sm:col-span-2" htmlFor="person-email">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Email (sign-in)
              </span>
              <input
                id="person-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFormError(null)
                }}
                placeholder="jamie@company.com"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <label className="block text-left sm:col-span-2" htmlFor="person-password">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Initial password
              </span>
              <input
                id="person-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFormError(null)
                }}
                placeholder="They can change it later in Firebase if you enable flows"
                autoComplete="new-password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Creating…' : 'Add to roster'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-left text-sm font-medium text-zinc-400">
          Roster ({teamMembers.length})
        </h3>
        {teamMembers.length === 0 ? (
          <Card className="py-12 text-center text-zinc-500">No people on the roster yet.</Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {teamMembers.map((m) => (
              <li key={m.id}>
                <Card className="py-4 text-left">
                  <p className="font-semibold text-white">{m.displayName}</p>
                  <p className="mt-1 text-sm text-cyan-200/90">{m.email}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {m.role === 'admin' ? 'Admin' : 'Member'}
                  </p>
                  {m.createdAt && (
                    <p className="mt-2 text-xs text-zinc-600">Added {m.createdAt}</p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
