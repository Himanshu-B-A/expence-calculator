import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ExpenseAppProvider } from './context/ExpenseAppContext'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './routes/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { AddExpensePage } from './pages/AddExpensePage'
import { AddCollectedPage } from './pages/AddCollectedPage'
import { EditExpensePage } from './pages/EditExpensePage'
import { EditCollectedPage } from './pages/EditCollectedPage'
import { ReportPage } from './pages/ReportPage'
import { ReportDetailPage } from './pages/ReportDetailPage'
import { TeamPage } from './pages/TeamPage'

export default function App() {
  return (
    <ExpenseAppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="projects" replace />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="projects/:projectId/expenses/new" element={<AddExpensePage />} />
              <Route path="projects/:projectId/expenses/:expenseId/edit" element={<EditExpensePage />} />
              <Route
                path="projects/:projectId/collected/:collectionId/edit"
                element={<EditCollectedPage />}
              />
              <Route path="projects/:projectId/collected/new" element={<AddCollectedPage />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="report/:projectId" element={<ReportDetailPage />} />
              <Route path="team" element={<TeamPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ExpenseAppProvider>
  )
}
