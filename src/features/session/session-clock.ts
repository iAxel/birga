/** SPEC §4: the last minute of a session shows a shrinking bar. */
export const COUNTDOWN_MS = 60_000

/** The time of a running session. Parent mode pauses it; the app in the background does not, so it cannot be stretched. */
export interface SessionClock {
  startedAt: number
  limitMs: number
  pausedAt: number | null
  pausedTotalMs: number
}

export function startClock(now: number, limitMs: number): SessionClock {
  return {
    startedAt: now,
    limitMs,
    pausedAt: null,
    pausedTotalMs: 0,
  }
}

export function pauseClock(clock: SessionClock, now: number): SessionClock {
  if (clock.pausedAt !== null) {
    return clock
  }

  return {
    ...clock,
    pausedAt: now,
  }
}

export function resumeClock(clock: SessionClock, now: number): SessionClock {
  if (clock.pausedAt === null) {
    return clock
  }

  return {
    ...clock,
    pausedAt: null,
    pausedTotalMs: clock.pausedTotalMs + now - clock.pausedAt,
  }
}

export function remainingMs(clock: SessionClock, now: number): number {
  const pausedNowMs = clock.pausedAt === null ? 0 : now - clock.pausedAt
  const playedMs = now - clock.startedAt - clock.pausedTotalMs - pausedNowMs

  return Math.max(0, clock.limitMs - playedMs)
}

/** The moment the session was due to end, counting the time it spent paused; for a session the app slept through. */
export function endsAt(clock: SessionClock): number {
  return clock.startedAt + clock.pausedTotalMs + clock.limitMs
}

/** Length of the countdown bar in the last minute, from 1 down to 0; null before the last minute. */
export function countdownShare(remaining: number): number | null {
  if (remaining > COUNTDOWN_MS) {
    return null
  }

  return remaining / COUNTDOWN_MS
}

/** How much longer the minimum break blocks a new session; 0 once it has passed or when there is no break. */
export function breakLeftMs(lastTimerEndedAt: number | null, minBreakMs: number, now: number): number {
  if (lastTimerEndedAt === null) {
    return 0
  }

  return Math.max(0, lastTimerEndedAt + minBreakMs - now)
}
