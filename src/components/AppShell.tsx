import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useExpenseApp } from '../context/ExpenseAppContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30'
      : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200',
  ].join(' ')

export function AppShell() {
  const { logout, isAdmin } = useExpenseApp()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-lg font-bold text-zinc-950 shadow-lg shadow-cyan-500/20">
            EA
          </div>
          <div className="text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/90">
              Expense Adder
            </p>
            <h1 className="text-lg font-semibold text-white">Workspace</h1>
          </div>
          <span
            className={
              isAdmin
                ? 'rounded-full border border-violet-500/35 bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-200'
                : 'rounded-full border border-zinc-600/80 bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-400'
            }
          >
            {isAdmin ? 'Admin' : 'Team member'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-1 backdrop-blur">
            <NavLink to="/app/projects" className={navClass}>
              Projects
            </NavLink>
            <NavLink to="/app/report" className={navClass}>
              Report
            </NavLink>
            <NavLink to="/app/team" className={navClass}>
              Team
            </NavLink>
          </nav>
          <button
            type="button"
            onClick={() => {
              void logout()
              navigate('/login', { replace: true })
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
