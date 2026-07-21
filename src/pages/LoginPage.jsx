import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert, Field, inputClass } from '../components/ui'

export default function LoginPage() {
  const { login, isAuthenticated, isOrganizer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where the guard (or the booking panel) wanted us to end up.
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated)
    return <Navigate to={from ?? (isOrganizer ? '/organizer' : '/dashboard')} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setSubmitting(true)
    try {
      const user = await login(form)
      const fallback = user.role === 'organizer' ? '/organizer' : '/dashboard'
      navigate(from ?? fallback, { replace: true })
    } catch (err) {
      setError(err.message ?? 'Login failed.')
      setErrors(err.errors ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (email) => setForm({ email, password: 'password' })

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Log in to book tickets and manage your events.
      </p>

      {from && (
        <div className="mt-4">
          <Alert tone="info">Log in to continue to that page.</Alert>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        {error && !Object.keys(errors).length && <Alert>{error}</Alert>}

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-center text-sm text-slate-600">
          No account?{' '}
          <Link
            to="/register"
            state={location.state}
            className="font-medium text-brand-700 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>

      {/* Seeded accounts — this block goes away once real registration exists. */}
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Demo accounts
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => fillDemo('attendee@eventide.test')}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Attendee
          </button>
          <button
            onClick={() => fillDemo('organizer@eventide.test')}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Organiser
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Password: password</p>
      </div>
    </div>
  )
}
