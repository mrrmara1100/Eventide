// Always renders a currency amount. Use for totals and revenue, where zero is a
// real number rather than a price point.
export const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value))

// For ticket prices, where zero means the tier costs nothing.
export const formatPrice = (value) =>
  Number(value) === 0 ? 'Free' : formatMoney(value)

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

export const formatDateTime = (iso) => `${formatDate(iso)} · ${formatTime(iso)}`

export const isPast = (iso) => new Date(iso) < new Date()

// `datetime-local` inputs want `YYYY-MM-DDTHH:mm` in local time, which is not
// what toISOString gives you.
export const toDateTimeLocal = (iso) => {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const STATUS_STYLES = {
  confirmed: 'bg-emerald-100 text-emerald-800',
  checked_in: 'bg-brand-100 text-brand-800',
  cancelled: 'bg-slate-200 text-slate-600',
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
}

export const STATUS_LABELS = {
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  cancelled: 'Cancelled',
  draft: 'Draft',
  published: 'Published',
}
