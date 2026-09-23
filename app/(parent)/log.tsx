import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useVoicePlayer } from '@/audio/use-voice-player'
import { type Attempt, mediaUri } from '@/db'
import { groupByDay, timeOfDay } from '@/features/parent/attempt-days'
import { dayLabel } from '@/features/parent/day-label'
import { useAttempts } from '@/features/parent/use-attempts'
import { useNow } from '@/features/session/use-now'
import { strings } from '@/i18n'
import { ListRow, Panel, SectionLabel } from '@/ui/panel'
import { ParentScreen } from '@/ui/parent-screen'
import { space, typography } from '@/ui/theme'

/** Long enough for the day headings to be right after midnight. */
const REFRESH_MS = 60_000

interface AttemptRowProps {
  attempt: Attempt
  hasSeparator: boolean
  onPlay: () => void
}

/**
 * Daily summary of the event log and its export via the share sheet (SPEC §5). The recorded attempts are here; the
 * counters, the per-card bars and the export come with build step 8.
 */
export default function LogScreen(): ReactElement {
  const player = useVoicePlayer()
  const attempts = useAttempts()
  const now = useNow(REFRESH_MS)
  const days = groupByDay(attempts ?? [])

  function play(attempt: Attempt): void {
    player.replace({
      uri: mediaUri(attempt.audioPath),
    })
    player.play()
  }

  return (
    <ParentScreen title={strings.parent.log}>
      <SectionLabel title={strings.log.attempts} />
      {attempts && attempts.length === 0 && (
        <Panel>
          <Text style={typography.body}>{strings.log.attemptsEmpty}</Text>
        </Panel>
      )}
      {days.map((day) => (
        <View key={day.day} style={styles.day}>
          <Text style={typography.section}>{dayLabel(day.day, now)}</Text>
          <Panel hasRows>
            {day.attempts.map((attempt, index) => (
              <AttemptRow
                attempt={attempt}
                hasSeparator={index < day.attempts.length - 1}
                key={attempt.id}
                onPlay={() => play(attempt)}
              />
            ))}
          </Panel>
        </View>
      ))}
      <Panel>
        <Text style={typography.body}>{strings.parent.logComingSoon}</Text>
      </Panel>
    </ParentScreen>
  )
}

function AttemptRow({ attempt, hasSeparator, onPlay }: AttemptRowProps): ReactElement {
  return (
    <ListRow
      hasChevron={false}
      hasSeparator={hasSeparator}
      icon="play.fill"
      onPress={onPlay}
      title={attempt.cardText ?? strings.log.attemptWithoutCard}
      value={strings.log.attemptMeta(timeOfDay(attempt.ts), (attempt.durationMs / 1000).toFixed(1))}
    />
  )
}

const styles = StyleSheet.create({
  day: {
    gap: space.sm,
  },
})
