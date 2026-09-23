const MINUTE_MS = 60_000

const HOUR_MS = 60 * MINUTE_MS

const DAY_MS = 24 * HOUR_MS

export interface Age {
  unit: 'now' | 'minute' | 'hour' | 'day'
  count: number
}

/** How long ago something happened, in the largest unit that still counts: parent home says it in words. */
export function ageOf(happenedAt: number, now: number): Age {
  const passed = Math.max(0, now - happenedAt)

  if (passed < MINUTE_MS) {
    return {
      unit: 'now',
      count: 0,
    }
  }

  if (passed < HOUR_MS) {
    return {
      unit: 'minute',
      count: Math.floor(passed / MINUTE_MS),
    }
  }

  if (passed < DAY_MS) {
    return {
      unit: 'hour',
      count: Math.floor(passed / HOUR_MS),
    }
  }

  return {
    unit: 'day',
    count: Math.floor(passed / DAY_MS),
  }
}

/** Midnight of the day `now` falls on, in local time: the sessions of today are counted from there. */
export function startOfDay(now: number): number {
  const date = new Date(now)

  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
