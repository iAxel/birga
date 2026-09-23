import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import type { ActiveBoard } from '@/features/cards/use-active-board'
import { ageLabel } from '@/features/parent/age-label'
import { ageOf } from '@/features/parent/relative-time'
import { remainingMs } from '@/features/session/session-clock'
import { useSession } from '@/features/session/session-provider'
import { useNow } from '@/features/session/use-now'
import { useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { Panel } from '@/ui/panel'
import { ParentButton } from '@/ui/parent-button'
import { color, space, typography } from '@/ui/theme'

const REFRESH_MS = 15_000

const MINUTE_MS = 60_000

const PROGRESS_HEIGHT = 6

interface SessionControlsProps {
  /** The board the child will see, summed up under the start button; undefined while loading. */
  activeBoard: ActiveBoard | null | undefined
  /** When the last session ended; null before the first one, undefined while loading. */
  lastEndedAt: number | null | undefined
}

/** Leaves parent mode for child mode, resuming the paused session if there is one. */
export function useBackToChildMode(): (returnedAt: number) => void {
  const session = useSession()
  const leaveParentMode = useLeaveParentMode()

  return (returnedAt) => {
    session.resume(returnedAt)

    leaveParentMode()
  }
}

function useLeaveParentMode(): () => void {
  const router = useRouter()

  return () => {
    if (router.canGoBack()) {
      router.back()

      return
    }

    router.replace('/')
  }
}

/**
 * The session panel of parent home: go back to the paused session or end it, or start a new one once the break after
 * the last full session is over. Returning to child mode without a session shows the calm start screen.
 */
export function SessionControls({ activeBoard, lastEndedAt }: SessionControlsProps): ReactElement {
  const session = useSession()
  const settings = useSettings()
  const backToChildMode = useBackToChildMode()
  const leaveParentMode = useLeaveParentMode()
  const now = useNow(REFRESH_MS)

  async function startSession(startedAt: number): Promise<void> {
    await session.start(startedAt)

    leaveParentMode()
  }

  function confirmEnd(): void {
    Alert.alert(strings.session.endConfirm, undefined, [
      {
        text: strings.common.cancel,
        style: 'cancel',
      },
      {
        text: strings.session.end,
        style: 'destructive',
        onPress: () => session.end('parent_exit', Date.now()),
      },
    ])
  }

  if (session.active) {
    const left = remainingMs(session.active.clock, now)
    const playedShare = 1 - left / session.active.clock.limitMs

    return (
      <Panel>
        <View style={styles.status}>
          <Text style={styles.statusText}>{strings.session.paused}</Text>
          <Text style={styles.statusText}>{strings.session.minutesLeft(Math.ceil(left / MINUTE_MS))}</Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.progress,
              {
                width: `${playedShare * 100}%`,
              },
            ]}
          />
        </View>
        <View style={styles.actions}>
          <ParentButton
            onPress={() => backToChildMode(Date.now())}
            style={styles.action}
            title={strings.session.resume}
            variant="primary"
          />
          <ParentButton onPress={confirmEnd} style={styles.action} title={strings.session.end} />
        </View>
      </Panel>
    )
  }

  const breakLeft = session.breakLeftMs(now)

  return (
    <Panel>
      <View style={styles.status}>
        <Text style={styles.statusText}>{strings.session.none}</Text>
        <Text style={styles.statusText}>{idleNote(breakLeft, lastEndedAt, now)}</Text>
      </View>
      <ParentButton
        disabled={breakLeft > 0}
        onPress={() => startSession(Date.now())}
        title={strings.session.start(settings.sessionMinutes)}
        variant="primary"
      />
      {activeBoard !== undefined && (
        <Text style={typography.body}>
          {activeBoard ? strings.session.board(activeBoard.board.title, activeBoard.cardCount) : strings.session.noBoard}
        </Text>
      )}
    </Panel>
  )
}

/** The break blocks a new session, so it comes first; otherwise the panel says when the last session ended. */
function idleNote(breakLeft: number, lastEndedAt: number | null | undefined, now: number): string {
  if (breakLeft > 0) {
    return strings.session.breakLeft(Math.ceil(breakLeft / MINUTE_MS))
  }

  if (!lastEndedAt) {
    return ''
  }

  return strings.session.lastAgo(ageLabel(ageOf(lastEndedAt, now)))
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  statusText: {
    ...typography.row,
    color: color.muted,
  },
  track: {
    height: PROGRESS_HEIGHT,
    overflow: 'hidden',
    borderRadius: PROGRESS_HEIGHT / 2,
    backgroundColor: color.panelAlt,
  },
  progress: {
    height: PROGRESS_HEIGHT,
    backgroundColor: color.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  action: {
    flex: 1,
  },
})
