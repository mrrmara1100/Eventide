import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Nothing to see here
      </h1>
      <p className="mt-2 text-slate-600">
        That page does not exist — it may have moved.
      </p>
      <Link
        to="/events"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Browse events
      </Link>
    </div>
  )
}
