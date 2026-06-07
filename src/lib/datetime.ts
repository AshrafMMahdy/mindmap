const pad = (n: number) => String(n).padStart(2, '0')

/** Split a stored reminder into <input type=date> / <input type=time> values. */
export function reminderInputs(due: number | null, hasTime: boolean): { date: string; time: string } {
  if (!due) return { date: '', time: '' }
  const d = new Date(due)
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: hasTime ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '',
  }
}

/** Build a due timestamp from date (+ optional time) inputs. */
export function toDue(date: string, time: string): { due: number; hasTime: boolean } | null {
  if (!date) return null
  const [y, m, dd] = date.split('-').map(Number)
  let hh = 0
  let mi = 0
  const hasTime = !!time
  if (time) {
    const [a, b] = time.split(':').map(Number)
    hh = a || 0
    mi = b || 0
  }
  return { due: new Date(y, (m || 1) - 1, dd || 1, hh, mi, 0, 0).getTime(), hasTime }
}

/** Human label, e.g. "Jun 8" or "Jun 8, 2:30 PM" (year shown only if not current). */
export function formatReminder(due: number, hasTime: boolean): string {
  const d = new Date(due)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const dateOpts: Intl.DateTimeFormatOptions = sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' }
  const datePart = d.toLocaleDateString(undefined, dateOpts)
  if (!hasTime) return datePart
  return `${datePart}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

export type ReminderStatus = 'overdue' | 'today' | 'upcoming'

export function reminderStatus(due: number, hasTime: boolean): ReminderStatus {
  const now = new Date()
  const d = new Date(due)
  if (!hasTime) {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    if (day < today) return 'overdue'
    return day === today ? 'today' : 'upcoming'
  }
  if (due < now.getTime()) return 'overdue'
  return d.toDateString() === now.toDateString() ? 'today' : 'upcoming'
}
