import { memo, type ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useReducedMotion } from 'react-native-reanimated'
import { levelOrMinimum } from '@/audio/metering'
import { color, space } from '@/ui/theme'

const HEIGHT = 40

const BAR_WIDTH = 4

const BAR_GAP = 3

/** A slot the recording has not reached shows as a dot as wide as the bar. */
const QUIET_SCALE = BAR_WIDTH / HEIGHT

/** A bar grows over the interval between two readings, so the row grows evenly instead of jumping bar by bar. */
const GROW_MS = 100

interface WaveformProps {
  /** Loudness of the recording, one value per slot, from 0 to 1; empty while nothing has been recorded. */
  levels: number[]
  /** How many slots the row holds: the recording fills as many as it lasted, the rest stay quiet. */
  slots: number
  /** How many bars the playback has passed; all of them while nothing is playing. */
  playedSlots?: number
}

interface WaveBarProps {
  /** Undefined for a slot the recording has not reached. */
  level: number | undefined
  isPlayed: boolean
  isStill: boolean
}

/**
 * The shape of the parent's recording (DESIGN §3, OVOZ): a bar per tenth of a second, accent for the part that was
 * spoken, hint for the time left. While the recording plays, the bars it has passed stay accent and the rest turn
 * hint, so the row doubles as the playback position. A recording made before the app kept its shape has no levels:
 * its bars stay flat.
 *
 * Every bar keeps its place in the row and only scales, which costs no layout, and a change re-renders the one bar it
 * belongs to, so neither recording nor playback re-renders the row ten times a second.
 */
export function Waveform({ levels, slots, playedSlots = levels.length }: WaveformProps): ReactElement {
  const isStill = useReducedMotion()

  return (
    <View style={styles.row}>
      {Array.from({ length: slots }, (_, index) => (
        <WaveBar isPlayed={index < playedSlots} isStill={isStill} key={index} level={levels[index]} />
      ))}
    </View>
  )
}

const WaveBar = memo(function WaveBar({ level, isPlayed, isStill }: WaveBarProps): ReactElement {
  const isQuiet = level === undefined

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: isQuiet || !isPlayed ? color.hint : color.accent,
          transform: [
            {
              scaleY: isQuiet ? QUIET_SCALE : levelOrMinimum(level),
            },
          ],
          transitionProperty: isStill ? 'none' : ['transform', 'backgroundColor'],
          transitionDuration: GROW_MS,
          transitionTimingFunction: 'linear',
        },
      ]}
    />
  )
})

const styles = StyleSheet.create({
  row: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
    paddingHorizontal: space.xs,
  },
  bar: {
    width: BAR_WIDTH,
    height: HEIGHT,
    borderRadius: BAR_WIDTH / 2,
  },
})
