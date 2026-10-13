/** "2026-10-11" -> "11 Oct 2026": easier to read at a glance than an ISO date.
    Display only - keep ISO dates wherever a table sorts by cell text. */
export function displayDate(iso?: string | null): string {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
