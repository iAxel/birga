import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { activityLevel, type WeekDay } from '@/features/parent/log-week'
import { strings } from '@/i18n'
import { color, radius, space, typography } from '@/ui/theme'

const TILE_HEIGHT = 56

/** How strongly a day is filled, from nothing to a full day of taps. */
const TINTS = [0, 0.22, 0.55, 1]

interface WeekStripProps {
  days: WeekDay[]
}

/** The week at a glance (DESIGN §3, Log): one tile per day, the more the child tapped, the deeper the accent. */
export function WeekStrip({ days }: WeekStripProps): ReactElement {
  return (
    <View style={styles.strip}>
      {days.map((day, index) => (
        <View key={day.day} style={styles.column}>
          <Text style={[typography.body, day.isToday && styles.today]}>{strings.log.weekdays[index]}</Text>
          <View style={[styles.tile, tileLook(day)]} />
        </View>
      ))}
    </View>
  )
}

/** A day still to come stays empty, a quiet day is a soft tile, and the more taps, the deeper the accent. */
function tileLook(day: WeekDay): { backgroundColor: string; opacity: number } {
  const level = activityLevel(day.count)

  if (day.isAhead) {
    return {
      backgroundColor: color.panelAlt,
      opacity: 0.4,
    }
  }

  if (level === 0) {
    return {
      backgroundColor: color.panelAlt,
      opacity: 1,
    }
  }

  return {
    backgroundColor: color.accent,
    opacity: TINTS[level],
  }
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: space.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
  },
  tile: {
    width: '100%',
    height: TILE_HEIGHT,
    borderRadius: radius.buttonSm,
  },
  today: {
    color: color.accent,
  },
})
