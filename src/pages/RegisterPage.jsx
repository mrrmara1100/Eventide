import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert, Field, inputClass } from '../components/ui'

export default function RegisterPage() {
  const { register, isAuthenticated, isOrganizer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'attendee',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated)
    return <Navigate to={from ?? (isOrganizer ? '/organizer' : '/dashboard')} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})

    // Client-side check first — the API never sees a mismatched confirmation.
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['The passwords do not match.'] })
      return
    }

    setSubmitting(true)
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      const fallback = user.role === 'organizer' ? '/organizer' : '/dashboard'
      navigate(from ?? fallback, { replace: true })
    } catch (err) {
      setError(err.message ?? 'Registration failed.')
      setErrors(err.errors ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Book tickets as an attendee, or publish events as an organiser.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        {error && !Object.keys(errors).length && <Alert>{error}</Alert>}

        <Field label="Full name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </Field>

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

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          hint="At least 8 characters."
        >
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="password_confirmation"
          error={errors.password_confirmation}
        >
          <input
            id="password_confirmation"
            type="password"
            required
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={(e) =>
              setForm({ ...form, password_confirmation: e.target.value })
            }
            className={inputClass}
          />
        </Field>

        <Field label="I want to" error={errors.role}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'attendee', label: 'Attend events' },
              { value: 'organizer', label: 'Run events' },
            ].map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
                  form.role === option.value
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={form.role === option.value}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link
            to="/login"
            state={location.state}
            className="font-medium text-brand-700 hover:underline"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
