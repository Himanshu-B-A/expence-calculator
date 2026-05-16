import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useExpenseApp } from '../context/ExpenseAppContext'

export function RequireAuth() {
  const { isAuthenticated, authReady, firebaseConfigured } = useExpenseApp()
  const location = useLocation()

  if (!authReady) {
    return (
      <div className="flex min-h-svh items-center justify-center text-zinc-400">
        Loading…
      </div>
    )
  }

  if (!firebaseConfigured) {
    return <Navigate to="/login" replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
