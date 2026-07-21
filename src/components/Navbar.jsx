import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, isOrganizer, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/events')
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link to="/events" className="mr-2 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-coral-500 text-base font-bold text-white shadow-sm">
            E
          </span>
          <span className="font-display text-xl font-semibold italic tracking-tight text-slate-900">
            Eventide
          </span>
        </Link>

        <NavLink to="/events" className={linkClass}>
          Browse
        </NavLink>

        {isAuthenticated && !isOrganizer && (
          <NavLink to="/dashboard" className={linkClass}>
            My tickets
          </NavLink>
        )}

        {isOrganizer && (
          <>
            <NavLink to="/organizer" className={linkClass}>
              Manage events
            </NavLink>
            <NavLink to="/organizer/check-in" className={linkClass}>
              Check-in
            </NavLink>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:block">
                {user.name}
                {isOrganizer && (
                  <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                    Organiser
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
