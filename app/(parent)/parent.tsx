import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useActiveBoard } from '@/features/cards/use-active-board'
import { startOfDay } from '@/features/parent/relative-time'
import { tipOfDay } from '@/features/parent/tip-of-day'
import { useSessionStats } from '@/features/parent/use-session-stats'
import { useActiveSequence } from '@/features/sequences/use-active-sequence'
import { SessionControls, useBackToChildMode } from '@/features/session/session-controls'
import { useNow } from '@/features/session/use-now'
import { strings } from '@/i18n'
import { ListRow, Panel, SectionLabel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { color, font, space, typography } from '@/ui/theme'

/** The tip and today's count change at midnight; parent home is seldom open for long, so a minute is precise enough. */
const TIP_REFRESH_MS = 60_000

/**
 * Parent mode home (DESIGN §3): the session panel, the sections of parent mode, a tip of the day, and the way back to
 * child mode.
 */
export default function ParentHomeScreen(): ReactElement {
  const router = useRouter()
  const activeBoard = useActiveBoard()
  const now = useNow(TIP_REFRESH_MS)
  const stats = useSessionStats(startOfDay(now))
  const sequence = useActiveSequence()
  const backToChildMode = useBackToChildMode()
  const tip = strings.sessionGuide.steps[tipOfDay(new Date(now), strings.sessionGuide.steps.length)]

  return (
    <ParentScreen
      footer={<ParentButton onPress={() => backToChildMode(Date.now())} title={strings.parent.close} />}
      hasBack={false}
      title={strings.child.wordmark}
    >
      <SessionControls activeBoard={activeBoard} lastEndedAt={stats?.lastEndedAt} />
      <Panel hasRows>
        <ListRow icon="list.bullet" onPress={() => router.push('/session-guide')} title={strings.sessionGuide.title} />
      </Panel>
      <Panel hasRows>
        <ListRow
          hasSeparator
          icon="square.grid.2x2"
          onPress={() => router.push('/cards')}
          title={strings.parent.cards}
          value={activeBoard ? strings.boards.summary(activeBoard.board.title, activeBoard.cardCount) : undefined}
        />
        <ListRow
          hasSeparator
          icon="waveform"
          onPress={() => router.push('/sequences')}
          title={strings.parent.sequences}
          value={sequence?.title}
        />
        <ListRow
          hasSeparator
          icon="chart.bar"
          onPress={() => router.push('/log')}
          title={strings.parent.log}
          value={stats && stats.todayCount > 0 ? strings.parent.logToday(stats.todayCount) : undefined}
        />
        <ListRow icon="gearshape" onPress={() => router.push('/settings')} title={strings.parent.settings} />
      </Panel>
      <Panel>
        <SectionLabel title={strings.tips.title} />
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tip}>{tip.text}</Text>
      </Panel>
    </ParentScreen>
  )
}

const styles = StyleSheet.create({
  tipTitle: {
    ...typography.row,
    marginBottom: -space.sm,
    fontFamily: font.bold,
  },
  tip: {
    color: color.ink,
    fontFamily: font.regular,
    fontSize: 17,
    lineHeight: 24,
  },
})
