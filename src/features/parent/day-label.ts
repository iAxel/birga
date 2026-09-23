import { startOfDay } from '@/features/parent/relative-time'
import { strings } from '@/i18n'

/** "Bugun, 23 sentabr" for today, "22 sentabr" for any other day. */
export function dayLabel(day: number, now: number): string {
  const date = new Date(day)
  const written = strings.log.day(date.getDate(), strings.log.months[date.getMonth()])

  if (day === startOfDay(now)) {
    return strings.log.todayDay(written)
  }

  return written
}
