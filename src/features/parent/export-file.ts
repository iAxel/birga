import type { EventRow } from '@/db'

/** Columns of events.csv, in this order. */
const COLUMNS = ['id', 'ts', 'time', 'type', 'session_id', 'card_id', 'sequence_id', 'item_position', 'payload'] as const

/** The event log as a spreadsheet: one row per event, the time both as a number and as it reads. */
export function eventsCsv(events: EventRow[]): string {
  const rows = events.map((event) => [
    event.id,
    event.ts,
    new Date(event.ts).toISOString(),
    event.type,
    event.session_id,
    event.card_id,
    event.sequence_id,
    event.item_position,
    event.payload_json,
  ])

  return [COLUMNS.join(','), ...rows.map((row) => row.map(csvValue).join(','))].join('\n')
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
