import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { remainingMs } from '@/features/session/session-clock'
import { useSession } from '@/features/session/session-provider'
import { useNow } from '@/features/session/use-now'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { spacing, typography } from '@/ui/theme'

const REFRESH_MS = 15_000

const MINUTE_MS = 60_000

/**
 * Session state and actions in parent mode: go back to the paused session or end it, or start a new one once the break
 * after the last full session is over. Returning to child mode without a session shows the calm goodbye screen.
 */
export function SessionControls(): ReactElement {
  const router = useRouter()
  const session = useSession()
  const now = useNow(REFRESH_MS)

  function leaveParentMode(): void {
    if (router.canGoBack()) {
      router.back()

      return
    }

    router.replace('/')
  }

  function backToChildMode(returnedAt: number): void {
    session.resume(returnedAt)

    leaveParentMode()
  }

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
    const minutesLeft = Math.ceil(remainingMs(session.active.clock, now) / MINUTE_MS)

    return (
      <View style={styles.block}>
        <Text style={typography.caption}>{strings.session.pausedLeft(minutesLeft)}</Text>
        <ParentButton onPress={() => backToChildMode(Date.now())} title={strings.parent.backToChild} variant="primary" />
        <ParentButton onPress={confirmEnd} title={strings.session.end} />
      </View>
    )
  }

  const breakLeft = session.breakLeftMs(now)
  const status = breakLeft > 0 ? strings.session.breakLeft(Math.ceil(breakLeft / MINUTE_MS)) : strings.session.none

  return (
    <View style={styles.block}>
      <Text style={typography.caption}>{status}</Text>
      <ParentButton
        disabled={breakLeft > 0}
        onPress={() => startSession(Date.now())}
        title={strings.session.start}
        variant="primary"
      />
      <ParentButton onPress={() => backToChildMode(Date.now())} title={strings.parent.backToChild} />
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
})
