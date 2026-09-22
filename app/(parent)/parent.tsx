import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useActiveBoard } from '@/features/cards/use-active-board'
import { tipOfDay } from '@/features/parent/tip-of-day'
import { SessionControls, useBackToChildMode } from '@/features/session/session-controls'
import { useNow } from '@/features/session/use-now'
import { strings } from '@/i18n'
import { Ornaments } from '@/ui/ornaments'
import { ListRow, Panel, SectionLabel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { ParentScreen } from '@/ui/parent-screen'
import { color, font, typography } from '@/ui/theme'

/** The tip changes at midnight; parent home is seldom open for long, so a minute is precise enough. */
const TIP_REFRESH_MS = 60_000

/**
 * Parent mode home (DESIGN §3): the session panel, the sections of parent mode, a tip of the day, and the way back to
 * child mode.
 */
export default function ParentHomeScreen(): ReactElement {
  const router = useRouter()
  const activeBoard = useActiveBoard()
  const backToChildMode = useBackToChildMode()
  const now = useNow(TIP_REFRESH_MS)
  const tip = strings.tips.items[tipOfDay(new Date(now), strings.tips.items.length)]

  return (
    <ParentScreen
      accessory={<Text style={styles.label}>{strings.parent.label}</Text>}
      background={<Ornaments smallOpacity={0.4} />}
      footer={<ParentButton onPress={() => backToChildMode(Date.now())} title={strings.parent.close} />}
      hasBack={false}
      title={strings.child.wordmark}
    >
      <SessionControls activeBoard={activeBoard} />
      <Panel hasRows>
        <ListRow
          hasSeparator
          icon="square.grid.2x2"
          onPress={() => router.push('/cards')}
          title={strings.parent.cards}
          value={activeBoard ? strings.boards.summary(activeBoard.board.title, activeBoard.cardCount) : undefined}
        />
        <ListRow hasSeparator icon="waveform" onPress={() => router.push('/sequences')} title={strings.parent.sequences} />
        <ListRow hasSeparator icon="chart.bar" onPress={() => router.push('/log')} title={strings.parent.log} />
        <ListRow icon="gearshape" onPress={() => router.push('/settings')} title={strings.parent.settings} />
      </Panel>
      <Panel>
        <SectionLabel title={strings.tips.title} />
        <Text style={styles.tip}>{tip}</Text>
      </Panel>
    </ParentScreen>
  )
}

const styles = StyleSheet.create({
  label: {
    ...typography.row,
    color: color.muted,
  },
  tip: {
    color: color.ink,
    fontFamily: font.regular,
    fontSize: 17,
    lineHeight: 24,
  },
})
