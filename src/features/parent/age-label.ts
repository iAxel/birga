import type { Age } from '@/features/parent/relative-time'
import { strings } from '@/i18n'

/** "2 soat oldin" and the like, for the moment a session ended. */
export function ageLabel(age: Age): string {
  if (age.unit === 'now') {
    return strings.session.ageNow
  }

  if (age.unit === 'minute') {
    return strings.session.ageMinutes(age.count)
  }

  if (age.unit === 'hour') {
    return strings.session.ageHours(age.count)
  }

  return strings.session.ageDays(age.count)
}
