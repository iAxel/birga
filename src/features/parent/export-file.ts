import type { EventRow } from '@/db'

const MINUTE_MS = 60_000

/** Columns of events.csv, in this order. */
const COLUMNS = ['id', 'ts', 'time', 'type', 'session_id', 'card_id', 'sequence_id', 'item_position', 'payload'] as const

/** The event log as a spreadsheet: one row per event, the time both as a number and as the family's clock read it. */
export function eventsCsv(events: EventRow[]): string {
  const rows = events.map((event) => [
    event.id,
    event.ts,
    localTimestamp(event.ts),
    event.type,
    event.session_id,
    event.card_id,
    event.sequence_id,
    event.item_position,
    event.payload_json,
  ])

  return [COLUMNS.join(','), ...rows.map((row) => row.map(csvValue).join(','))].join('\n')
}

/**
 * A moment as the family's clock showed it, with that clock's offset from UTC: `2026-09-23T12:42:00+05:00`. In UTC,
 * everything the child did before five in the morning in Tashkent would land on the day before.
 */
export function localTimestamp(ts: number, offsetMinutes = -new Date(ts).getTimezoneOffset()): string {
  const wallClock = new Date(ts + offsetMinutes * MINUTE_MS).toISOString().slice(0, 19)
  const sign = offsetMinutes < 0 ? '-' : '+'
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0')

  return `${wallClock}${sign}${hours}:${minutes}`
}

/** Start of every export's name, which is also how an old one is recognised in the cache. */
export const EXPORT_PREFIX = 'birga-'

/** What the exported archive is called; the date makes two exports of different days easy to tell apart. */
export function exportFileName(now: number): string {
  const date = new Date(now)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${EXPORT_PREFIX}${date.getFullYear()}-${month}-${day}.zip`
}

/** Empty cells stay empty, and anything with a comma, a quote or a line break is quoted. */
function csvValue(value: string | number | null): string {
  if (value === null) {
    return ''
  }

  const text = String(value)

  if (!/[",\n\r]/.test(text)) {
    return text
  }

  return `"${text.replaceAll('"', '""')}"`
}
