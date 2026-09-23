import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { levelOrMinimum } from '@/audio/metering'
import { color, space } from '@/ui/theme'

const HEIGHT = 40

const BAR_WIDTH = 4

const BAR_GAP = 3

interface WaveformProps {
  /** Loudness of the recording, one value per slot, from 0 to 1; empty while nothing has been recorded. */
  levels: number[]
  /** How many slots the row holds: the recording fills as many as it lasted, the rest stay quiet. */
  slots: number
}

/**
 * The shape of the parent's recording (DESIGN §3, OVOZ): a bar per tenth of a second, accent for the part that was
 * spoken, hint for the time left. A recording made before the app kept its shape has no levels: its bars stay flat.
 */
export function Waveform({ levels, slots }: WaveformProps): ReactElement {
  return (
    <View style={styles.row}>
      {Array.from({ length: slots }, (_, index) => {
        const level = levels[index]

        return (
          <View
            key={index}
            style={[
              styles.bar,
              level === undefined ? styles.quiet : styles.spoken,
              {
                height: HEIGHT * (level === undefined ? 0 : levelOrMinimum(level)),
              },
            ]}
          />
        )
      })}
    </View>
  )
}

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
    borderRadius: BAR_WIDTH / 2,
  },
  spoken: {
    backgroundColor: color.accent,
  },
  quiet: {
    height: BAR_WIDTH,
    backgroundColor: color.hint,
  },
})
