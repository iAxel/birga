import { type ReactElement, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ParentControls } from '@/features/requests/parent-controls'
import { MODELING_MS } from '@/features/requests/request-gate'
import { RequestsBoard } from '@/features/requests/requests-board'
import { useActiveBoardCards } from '@/features/requests/use-active-board-cards'
import { PARENT_GATE_HEIGHT } from '@/features/session/parent-gate'
import { useEventLog } from '@/features/session/use-event-log'
import { useSettings } from '@/features/settings/settings-provider'
import { color } from '@/ui/theme'

/**
 * Child mode's main screen: the first cards of the active board and the parent's corner controls. The top strip stays
 * free for the parent gate; the bottom strip clears the home indicator unless the tab bar already does.
 */
export function RequestsView(): ReactElement {
  const insets = useSafeAreaInsets()
  const settings = useSettings()
  const logEvent = useEventLog()
  const cards = useActiveBoardCards()
  const [modelingUntil, setModelingUntil] = useState<number | null>(null)
  const lastPlayedCardIdRef = useRef<number | null>(null)

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

  function logAttempt(): void {
    logEvent({
      type: 'request_verbal_attempt',
      cardId: lastPlayedCardIdRef.current,
    })
  }

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + PARENT_GATE_HEIGHT,
          paddingBottom: settings.pauseGameEnabled ? 0 : insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <RequestsBoard
        cards={cards.slice(0, settings.cardsPerScreen)}
        cardsPerScreen={settings.cardsPerScreen}
        debounceMs={settings.debounceSeconds * 1000}
        isModeling={modelingUntil !== null}
        onPlayed={(cardId) => {
          lastPlayedCardIdRef.current = cardId
        }}
      />
      <ParentControls isModeling={modelingUntil !== null} onAttempt={logAttempt} onToggleModeling={toggleModeling} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.ground,
  },
})
