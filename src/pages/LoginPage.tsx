import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useExpenseApp } from '../context/ExpenseAppContext'
import { Button, Card } from '../components/Ui'

export function LoginPage() {
  const {
    isAuthenticated,
    login,
    firebaseConfigured,
    authReady,
  } = useExpenseApp()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!authReady) {
    return (
      <div className="flex min-h-svh items-center justify-center text-zinc-400">
        Loading…
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/app/projects" replace />
  }

  const destination = from && from !== '/login' ? from : '/app/projects'

  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
        <Card className="max-w-lg text-left">
          <h1 className="text-lg font-semibold text-white">Firebase configuration required</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Add your Firebase web app keys to a <code className="text-cyan-300">.env</code> file (see{' '}
            <code className="text-cyan-300">.env.example</code> in the repo root), then restart the dev
            server or redeploy on Vercel with the same variables.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-xl font-bold text-zinc-950 shadow-xl shadow-cyan-500/25">
          EA
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
            Expense Adder
          </p>
          <p className="text-lg font-semibold text-white">Login</p>
        </div>
      </div>

      <Card className="w-full max-w-md border-zinc-800/90">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              await login(email, password)
              navigate(destination, { replace: true })
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'code' in err
                  ? String((err as { code: string }).code)
                  : err instanceof Error
                    ? err.message
                    : 'Sign-in failed.'
              setError(msg.replace('auth/', '').replace(/-/g, ' '))
            }
          }}
          className="space-y-4 text-left"
        >
          {error && (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <label className="block" htmlFor="email">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Email
            </span>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <label className="block" htmlFor="password">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Password
            </span>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <Button type="submit" variant="primary" className="mt-2 w-full py-3">
            Login
          </Button>
        </form>
      </Card>
    </div>
  )
}
