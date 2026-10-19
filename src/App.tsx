import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import AdminShell from './components/Layout/AdminShell'
import AdminLogin from './components/Auth/AdminLogin'
import PulsePage from './components/Pages/PulsePage'
import PeoplePage from './components/Pages/PeoplePage'
import SafetyPage from './components/Pages/SafetyPage'
import ContentPage from './components/Pages/ContentPage'
import CreatorsPage from './components/Pages/CreatorsPage'
import CommercePage from './components/Pages/CommercePage'
import CommunitiesPage from './components/Pages/CommunitiesPage'
import AnalyticsPage from './components/Pages/AnalyticsPage'
import SupportPage from './components/Pages/SupportPage'
import AccessPage from './components/Pages/AccessPage'
import SystemPage from './components/Pages/SystemPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAdminAuth()
  if (!token || !user?.is_admin) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { token, user } = useAdminAuth()
  const isAuthed = !!(token && user?.is_admin)

  return (
    <Routes>
      <Route path="/login" element={isAuthed ? <Navigate to="/pulse" replace /> : <AdminLogin />} />
      <Route element={<ProtectedRoute><AdminShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/pulse" replace />} />
        <Route path="/pulse"       element={<PulsePage />} />
        <Route path="/people"      element={<PeoplePage />} />
        <Route path="/safety"      element={<SafetyPage />} />
        <Route path="/content"     element={<ContentPage />} />
        <Route path="/creators"    element={<CreatorsPage />} />
        <Route path="/commerce"    element={<CommercePage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/analytics"   element={<AnalyticsPage />} />
        <Route path="/support"     element={<SupportPage />} />
        <Route path="/access"      element={<AccessPage />} />
        <Route path="/system"      element={<SystemPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthed ? '/pulse' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
