// Section 2.4 — create/edit an event, plus manage its ticket tiers.
//
// Tiers are only editable once the event exists, because a ticket_type needs an
// event_id foreign key. On /organizer/events/new the tier panel is hidden until
// the first save.

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { eventsApi, ticketTypesApi } from '../services/api'
import { CATEGORIES } from '../services/mockData'
import { Alert, Field, Spinner, inputClass } from '../components/ui'
import { formatPrice, toDateTimeLocal } from '../utils/format'

const blankEvent = {
  title: '',
  description: '',
  venue: '',
  date_time: '',
  category: CATEGORIES[0],
  capacity: 100,
  status: 'draft',
}

export default function EventFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(blankEvent)
  const [ticketTypes, setTicketTypes] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false

    eventsApi
      .get(id)
      .then(({ data }) => {
        if (cancelled) return
        setForm({
          title: data.title,
          description: data.description ?? '',
          venue: data.venue,
          date_time: toDateTimeLocal(data.date_time),
          category: data.category,
          capacity: data.capacity,
          status: data.status,
        })
        setTicketTypes(data.ticket_types)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not load that event.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setNotice('')
    setSaving(true)

    try {
      if (isEdit) {
        const { data } = await eventsApi.update(id, form)
        setTicketTypes(data.ticket_types)
        setNotice('Changes saved.')
      } else {
        const { data } = await eventsApi.create(form)
        // Straight into edit mode so tiers can be added right away.
        navigate(`/organizer/events/${data.id}/edit`, { replace: true })
      }
    } catch (err) {
      setError(err.message ?? 'Could not save this event.')
      setErrors(err.errors ?? {})
    } finally {
      setSaving(false)
    }
  }

  const refreshTiers = async () => {
    const { data } = await eventsApi.get(id)
    setTicketTypes(data.ticket_types)
  }

  if (loading) return <Spinner label="Loading event…" />

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/organizer"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Manage events
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {isEdit ? 'Edit event' : 'New event'}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        {error && !Object.keys(errors).length && <Alert>{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}

        <Field label="Title" htmlFor="title" error={errors.title}>
          <input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={errors.description}
          hint="Shown on the public event page."
        >
          <textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Venue" htmlFor="venue" error={errors.venue}>
            <input
              id="venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field
            label="Date & time"
            htmlFor="date_time"
            error={errors.date_time}
          >
            <input
              id="date_time"
              type="datetime-local"
              value={form.date_time}
              onChange={(e) => setForm({ ...form, date_time: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Category" htmlFor="category" error={errors.category}>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Venue capacity"
            htmlFor="capacity"
            error={errors.capacity}
            hint="Total seats across all tiers."
          >
            <input
              id="capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Status"
          htmlFor="status"
          error={errors.status}
          hint="Only published events appear in the public listing."
        >
          <select
            id="status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>

        <div className="flex gap-3 border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
          </button>
          <Link
            to="/organizer"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>

      {isEdit ? (
        <TicketTypePanel
          eventId={Number(id)}
          ticketTypes={ticketTypes}
          onChanged={refreshTiers}
        />
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
          Save the event first — then you can add ticket tiers to it.
        </p>
      )}
    </div>
  )
}

// --- ticket tiers -----------------------------------------------------------

const blankTier = { name: '', price: '0', quantity_available: '50' }

function TicketTypePanel({ eventId, ticketTypes, onChanged }) {
  const [draft, setDraft] = useState(blankTier)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setDraft(blankTier)
    setEditingId(null)
    setErrors({})
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setErrors({})
    setError('')
    setBusy(true)

    try {
      if (editingId) await ticketTypesApi.update(editingId, draft)
      else await ticketTypesApi.create({ ...draft, event_id: eventId })
      await onChanged()
      reset()
    } catch (err) {
      setError(err.message ?? 'Could not save that ticket type.')
      setErrors(err.errors ?? {})
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = (tt) => {
    setEditingId(tt.id)
    setDraft({
      name: tt.name,
      price: String(tt.price),
      quantity_available: String(tt.quantity_available),
    })
    setErrors({})
    setError('')
  }

  const handleDelete = async (tt) => {
    if (!window.confirm(`Delete the "${tt.name}" tier?`)) return
    setError('')
    try {
      await ticketTypesApi.remove(tt.id)
      await onChanged()
      if (editingId === tt.id) reset()
    } catch (err) {
      setError(err.message ?? 'Could not delete that ticket type.')
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <h2 className="text-lg font-semibold text-slate-900">Ticket types</h2>
      <p className="mt-1 text-sm text-slate-600">
        Each tier has its own price and allocation — General, VIP, and so on.
      </p>

      {error && !Object.keys(errors).length && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {ticketTypes.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Price</th>
                <th className="pb-2 pr-4 font-medium">Sold</th>
                <th className="pb-2 pr-4 font-medium">Allocation</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {ticketTypes.map((tt) => (
                <tr key={tt.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {tt.name}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatPrice(tt.price)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{tt.sold}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {tt.quantity_available}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(tt)}
                      className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tt)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
      >
        <Field label="Name" htmlFor="tier-name" error={errors.name}>
          <input
            id="tier-name"
            value={draft.name}
            placeholder="General Admission"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Price" htmlFor="tier-price" error={errors.price}>
          <input
            id="tier-price"
            type="number"
            min={0}
            step="0.01"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          label="Quantity"
          htmlFor="tier-qty"
          error={errors.quantity_available}
        >
          <input
            id="tier-qty"
            type="number"
            min={1}
            value={draft.quantity_available}
            onChange={(e) =>
              setDraft({ ...draft, quantity_available: e.target.value })
            }
            className={inputClass}
          />
        </Field>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:bg-slate-300"
          >
            {busy ? 'Saving…' : editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
