import { type ReactElement, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Card } from '@/db'
import { type AttemptTarget, useSaveAttempt } from '@/features/attempts/use-save-attempt'
import { cardsOnScreen } from '@/features/requests/board-layout'
import { ParentControls } from '@/features/requests/parent-controls'
import { MODELING_MS } from '@/features/requests/request-gate'
import { RequestsBoard } from '@/features/requests/requests-board'
import { useActiveBoardCards } from '@/features/requests/use-active-board-cards'
import { useEventLog } from '@/features/session/use-event-log'
import { useSettings } from '@/features/settings/settings-provider'
import { useChildMetrics } from '@/ui/child-metrics'
import { color, space } from '@/ui/theme'

/**
 * Child mode's main screen: the first cards of the active board and the parent's corner controls. The board keeps
 * clear of the parent gate at the top and of the tab bar or the corner controls at the bottom.
 */
export function RequestsView(): ReactElement {
  const insets = useSafeAreaInsets()
  const metrics = useChildMetrics()
  const settings = useSettings()
  const logEvent = useEventLog()
  const saveAttempt = useSaveAttempt()
  const cards = useActiveBoardCards()
  const [modelingUntil, setModelingUntil] = useState<number | null>(null)
  const lastPlayedRef = useRef<Card | null>(null)
  const cardsPerScreen = cardsOnScreen(settings.cardsPerScreen, metrics.formFactor)

  useEffect(() => {
    if (modelingUntil === null) {
      return
    }

    const timeout = setTimeout(() => setModelingUntil(null), modelingUntil - Date.now())

    return () => clearTimeout(timeout)
  }, [modelingUntil])

  function toggleModeling(): void {
    setModelingUntil(modelingUntil === null ? Date.now() + MODELING_MS : null)
  }

  /**
   * A card played: the last one is what an attempt of the child is about. While the parent models, every tap of theirs
   * keeps modelling on for another minute, so it switches itself off only once they have stopped (SPEC §2).
   */
  function notePlayed(card: Card): void {
    lastPlayedRef.current = card

    if (modelingUntil !== null) {
      setModelingUntil(Date.now() + MODELING_MS)
    }
  }

  /** What an attempt of the child is about: the card the board played last, as it reads now. */
  function attemptTarget(): AttemptTarget {
    const card = lastPlayedRef.current

    return {
      cardId: card?.id ?? null,
      word: card?.text,
    }
  }

  function logAttempt(): boolean {
    const target = attemptTarget()

    logEvent({
      type: 'request_verbal_attempt',
      cardId: target.cardId,
      payload:
        target.word === undefined
          ? null
          : {
              word: target.word,
            },
    })

    return true
  }

  function keepAttempt(uri: string, durationMs: number, target: AttemptTarget | null): void {
    saveAttempt(uri, durationMs, target ?? {}).catch(() => undefined)
  }

  const bottom = settings.pauseGameEnabled
    ? insets.bottom + space.tabBar
    : Math.max(insets.bottom, metrics.cornerMargin) + metrics.corner

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.board,
          {
            paddingTop: insets.top + metrics.top - metrics.gap,
            paddingBottom: bottom - metrics.gap,
            paddingLeft: insets.left + metrics.pad - metrics.gap,
            paddingRight: insets.right + metrics.pad - metrics.gap,
          },
        ]}
      >
        <RequestsBoard
          cards={cards.slice(0, cardsPerScreen)}
          cardsPerScreen={cardsPerScreen}
          debounceMs={settings.debounceSeconds * 1000}
          gap={metrics.gap}
          isModeling={modelingUntil !== null}
          onPlayed={notePlayed}
        />
      </View>
      <ParentControls
        isModeling={modelingUntil !== null}
        attemptTarget={attemptTarget}
        onAttempt={logAttempt}
        onAttemptRecorded={keepAttempt}
        onToggleModeling={toggleModeling}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.ground,
  },
  board: {
    flex: 1,
  },
})
