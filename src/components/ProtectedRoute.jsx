// Route guard from section 2.3: unauthenticated users go to /login and are sent
// back to where they were headed once they are in. `requireOrganizer` adds the
// role gate for the admin panel.

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

export default function ProtectedRoute({ requireOrganizer = false }) {
  const { isAuthenticated, isOrganizer, loading } = useAuth()
  const location = useLocation()

  // Wait for the session check — redirecting now would log out anyone who
  // refreshed the page on a protected route.
  if (loading) return <Spinner label="Checking your session…" />

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />

  if (requireOrganizer && !isOrganizer)
    return <Navigate to="/dashboard" replace />

  return <Outlet />
}
