import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { type CardCount, useRepositories } from '@/db'
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
  /** Taps per card today, most played first. */
  cards: CardCount[]
  /** Cards the board had to ignore at least LOOP_TAPS times today. */
  loops: CardCount[]
}

/** What the log screen says about today and this week, reloaded whenever the screen comes back into view. */
export function useDayLog(): DayLog | undefined {
  const repositories = useRepositories()
  const [log, setLog] = useState<DayLog | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      async function load(): Promise<void> {
        const now = Date.now()
        const dayStart = startOfDay(now)
        const dayEnd = dayStart + DAY_MS
        const { events } = repositories

        const [counts, cards, debounced, weekTaps] = await Promise.all([
          events.countsByType(dayStart, dayEnd),
          events.countsByCard('request_tap', dayStart, dayEnd),
          events.countsByCard('request_tap_debounced', dayStart, dayEnd),
          events.timesOf('request_tap', startOfWeek(now), dayEnd),
        ])

        setLog({
          week: weekDays(now, weekTaps),
          sessions: counts.session_start ?? 0,
          taps: counts.request_tap ?? 0,
          attempts: (counts.request_verbal_attempt ?? 0) + (counts.attempt_recorded ?? 0),
          cards,
          loops: debounced.filter((card) => card.count >= LOOP_TAPS),
        })
      }

      load()
    }, [repositories]),
  )

  return log
}
