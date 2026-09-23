import { startOfDay } from '@/features/parent/relative-time'

const DAY_MS = 86_400_000

export interface WeekDay {
  /** Local midnight of the day. */
  day: number
  /** How much the child did that day; the strip tints each day by it. */
  count: number
  isToday: boolean
  /** A day that has not come yet stays empty. */
  isAhead: boolean
}

/** Monday of the week `now` falls in, in local time. */
export function startOfWeek(now: number): number {
  const day = startOfDay(now)
  const weekday = new Date(day).getDay()
  const sinceMonday = (weekday + 6) % 7

  return startOfDay(day - sinceMonday * DAY_MS)
}

/** The seven days of this week with the events of each, Monday first. */
export function weekDays(now: number, times: number[]): WeekDay[] {
  const today = startOfDay(now)
  const monday = startOfWeek(now)
  const counts = new Map<number, number>()

  for (const time of times) {
    const day = startOfDay(time)

    counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(monday + index * DAY_MS)

    return {
      day,
      count: counts.get(day) ?? 0,
      isToday: day === today,
      isAhead: day > today,
    }
  })
}

/** How busy a day was, from 0 (nothing) to 3, for the four tints of the week strip. */
export function activityLevel(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) {
    return 0
  }

  if (count < 5) {
    return 1
  }

  if (count < 15) {
    return 2
  }

  return 3
}
