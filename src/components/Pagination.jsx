// Driven by Laravel's paginator meta (current_page / last_page / total), so it
// keeps working unchanged once the real API is wired up.

export default function Pagination({ meta, onChange }) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page: current, last_page: last } = meta
  const pages = []
  for (let p = 1; p <= last; p++) {
    // Always show first, last, and a window around the current page.
    if (p === 1 || p === last || Math.abs(p - current) <= 1) pages.push(p)
    else if (pages.at(-1) !== '…') pages.push('…')
  }

  const buttonClass = (active) =>
    `min-w-9 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white'
    }`

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 pt-8"
    >
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={buttonClass(false)}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === current ? 'page' : undefined}
            className={buttonClass(p === current)}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === last}
        className={buttonClass(false)}
      >
        Next
      </button>
    </nav>
  )
}
