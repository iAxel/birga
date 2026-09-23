import type { Attempt } from '@/db'
import { startOfDay } from '@/features/parent/relative-time'

export interface AttemptDay {
  /** Local midnight of the day these attempts belong to. */
  day: number
  attempts: Attempt[]
}

/** Attempts of one day together, newest day first, in the order they came in. */
export function groupByDay(attempts: Attempt[]): AttemptDay[] {
  const days: AttemptDay[] = []

  for (const attempt of attempts) {
    const day = startOfDay(attempt.ts)
    const last = days.at(-1)

    if (last && last.day === day) {
      last.attempts.push(attempt)

      continue
    }

    days.push({
      day,
      attempts: [attempt],
    })
  }

  return days
}

/** The clock time of an attempt, as the log lists it. */
export function timeOfDay(ts: number): string {
  const date = new Date(ts)

  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
