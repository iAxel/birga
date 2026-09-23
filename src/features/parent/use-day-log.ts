import { useCallback } from 'react'
import { type CardCount, useRepositories } from '@/db'
import { useFocusQuery } from '@/db/use-focus-query'
import { startOfWeek, type WeekDay, weekDays } from '@/features/parent/log-week'
import { startOfDay } from '@/features/parent/relative-time'

const DAY_MS = 86_400_000

/** SPEC §6: this many ignored taps on one card in a day is the sign of a loop, not of a request. */
export const LOOP_TAPS = 5

export interface DayLog {
  /** The child's taps over the seven days of this week. */
  week: WeekDay[]
  sessions: number
  taps: number
  attempts: number
  /**
   * Pauses that ran their course today, and the ones the microphone heard filled (SPEC §5): the share is how often the
   * detector heard the child. A pause the parent credited, or one the game left early, is in neither.
   */
  pauses: number
  pausesFilled: number
  /** Taps per card today, most played first. */
  cards: CardCount[]
  /** Cards the child tapped again at least LOOP_TAPS times today while they were still resting. */
  loops: CardCount[]
}

/**
 * What the log screen says about today and this week, for the day starting at `day`: reloaded whenever the screen
 * comes back into view, and when midnight passes while it is open.
 */
export function useDayLog(day: number): DayLog | undefined {
  const repositories = useRepositories()

  return useFocusQuery(
    useCallback(async () => {
      const now = Date.now()
      const dayStart = startOfDay(day)
      const dayEnd = dayStart + DAY_MS
      const { events } = repositories

      const [counts, cards, repeats, weekTaps] = await Promise.all([
        events.countsByType(dayStart, dayEnd),
        events.countsByCard('request_tap', dayStart, dayEnd),
        events.repeatsByCard(dayStart, dayEnd),
        events.timesOf('request_tap', startOfWeek(now), dayEnd),
      ])

      return {
        week: weekDays(now, weekTaps),
        sessions: counts.session_start ?? 0,
        taps: counts.request_tap ?? 0,
        attempts: (counts.request_verbal_attempt ?? 0) + (counts.attempt_recorded ?? 0) + (counts.pause_parent_credit ?? 0),
        pauses: (counts.pause_filled ?? 0) + (counts.pause_timeout ?? 0),
        pausesFilled: counts.pause_filled ?? 0,
        cards,
        loops: repeats.filter((card) => card.count >= LOOP_TAPS),
      }
    }, [repositories, day]),
  )
}
