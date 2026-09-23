import { SymbolView } from 'expo-symbols'
import { type ReactElement, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useVoicePlayer } from '@/audio/use-voice-player'
import { type Attempt, type CardCount, mediaUri, useRepositories } from '@/db'
import { groupByDay, timeOfDay } from '@/features/parent/attempt-days'
import { dayLabel } from '@/features/parent/day-label'
import { exportLog } from '@/features/parent/export-log'
import { startOfDay } from '@/features/parent/relative-time'
import { useAttempts } from '@/features/parent/use-attempts'
import { useDayLog } from '@/features/parent/use-day-log'
import { WeekStrip } from '@/features/parent/week-strip'
import { useNow } from '@/features/session/use-now'
import { strings } from '@/i18n'
import { ListRow, Panel, SectionLabel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { color, font, radius, space, typography } from '@/ui/theme'

/** Long enough for the day headings to be right after midnight. */
const REFRESH_MS = 60_000

const BAR_HEIGHT = 8

interface StatProps {
  count: number
  label: string
  isAccent?: boolean
}

interface CardBarProps {
  card: CardCount
  most: number
}

interface AttemptRowProps {
  attempt: Attempt
  hasSeparator: boolean
  onPlay: () => void
}

/**
 * The diary (SPEC §5): the week at a glance, what happened today, how the taps fell on the cards, the cards the child
 * is looping on, the attempts the parent recorded, and the export that takes all of it off the device.
 */
export default function LogScreen(): ReactElement {
  const repositories = useRepositories()
  const player = useVoicePlayer()
  const attempts = useAttempts()
  const now = useNow(REFRESH_MS)
  const log = useDayLog(startOfDay(now))
  const [isExporting, setIsExporting] = useState(false)
  const days = groupByDay(attempts ?? [])
  const most = log?.cards[0]?.count ?? 0

  function play(attempt: Attempt): void {
    player.replace({
      uri: mediaUri(attempt.audioPath),
    })
    player.play()
  }

  async function share(): Promise<void> {
    setIsExporting(true)

    try {
      await exportLog(repositories, Date.now())
    } catch {
      Alert.alert(strings.log.exportFailed)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ParentScreen
      accessory={
        <ParentButton
          accessibilityLabel={strings.log.export}
          disabled={isExporting}
          icon="square.and.arrow.up"
          onPress={share}
          title=""
        />
      }
      title={strings.parent.log}
    >
      <WeekStrip days={log?.week ?? []} />
      <View style={styles.section}>
        <SectionLabel title={dayLabel(startOfDay(now), now)} />
        <View style={styles.stats}>
          <Stat count={log?.sessions ?? 0} label={strings.log.sessions} />
          <Stat count={log?.taps ?? 0} label={strings.log.taps} />
          <Stat count={log?.attempts ?? 0} isAccent label={strings.log.tries} />
        </View>
      </View>
      {log?.loops.map((card) => (
        <Panel key={card.cardId} style={styles.loop}>
          <SymbolView name="exclamationmark.triangle" size={22} tintColor={color.rewardInk} />
          <View style={styles.loopText}>
            <Text style={typography.row}>{strings.log.loopTitle(card.cardText ?? '', card.count)}</Text>
            <Text style={typography.body}>{strings.log.loopHint}</Text>
          </View>
        </Panel>
      ))}
      {log && log.pauses > 0 && (
        <Panel>
          <SectionLabel title={strings.log.pauses} />
          <Text style={typography.row}>{strings.log.pauseRatio(log.pausesFilled, log.pauses)}</Text>
          <Text style={typography.body}>{strings.log.pauseHint}</Text>
        </Panel>
      )}
      {log && log.cards.length > 0 && (
        <Panel>
          <SectionLabel title={strings.log.byCards} />
          {log.cards.map((card) => (
            <CardBar card={card} key={card.cardId} most={most} />
          ))}
        </Panel>
      )}
      <SectionLabel title={strings.log.attempts} />
      {attempts && attempts.length === 0 && (
        <Panel>
          <Text style={typography.body}>{strings.log.attemptsEmpty}</Text>
        </Panel>
      )}
      {days.map((day) => (
        <View key={day.day} style={styles.section}>
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
    </ParentScreen>
  )
}

/** One of the three counts of today. */
function Stat({ count, label, isAccent = false }: StatProps): ReactElement {
  return (
    <Panel style={styles.stat}>
      <Text style={[styles.statCount, isAccent && styles.statAccent]}>{count}</Text>
      <Text style={typography.body}>{label}</Text>
    </Panel>
  )
}

/** How often one card was played today, next to the card that was played most. */
function CardBar({ card, most }: CardBarProps): ReactElement {
  return (
    <View style={styles.cardBar}>
      <Text numberOfLines={1} style={styles.cardWord}>
        {card.cardText}
      </Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${most === 0 ? 0 : (card.count / most) * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.cardCount}>{card.count}</Text>
    </View>
  )
}

function AttemptRow({ attempt, hasSeparator, onPlay }: AttemptRowProps): ReactElement {
  return (
    <ListRow
      hasChevron={false}
      hasSeparator={hasSeparator}
      icon="play.fill"
      onPress={onPlay}
      title={attempt.word ?? strings.log.attemptWithoutWord}
      value={strings.log.attemptMeta(timeOfDay(attempt.ts), (attempt.durationMs / 1000).toFixed(1))}
    />
  )
}

const styles = StyleSheet.create({
  section: {
    gap: space.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: space.sm,
  },
  stat: {
    flex: 1,
    gap: space.xs,
  },
  statCount: {
    color: color.ink,
    fontFamily: font.extraBold,
    fontSize: 34,
    letterSpacing: -1,
  },
  statAccent: {
    color: color.accent,
  },
  loop: {
    flexDirection: 'row',
    gap: space.md,
  },
  loopText: {
    flex: 1,
    gap: space.xs,
  },
  cardBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  cardWord: {
    ...typography.row,
    width: '30%',
  },
  track: {
    flex: 1,
    height: BAR_HEIGHT,
    overflow: 'hidden',
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: color.panelAlt,
  },
  fill: {
    height: BAR_HEIGHT,
    borderRadius: radius.buttonSm,
    backgroundColor: color.accent,
  },
  cardCount: {
    ...typography.row,
    minWidth: 24,
    color: color.muted,
    textAlign: 'right',
  },
})
