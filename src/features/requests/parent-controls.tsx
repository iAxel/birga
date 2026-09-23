import type { ReactElement } from 'react'
import { StyleSheet, View } from 'react-native'
import { AttemptCorner } from '@/features/attempts/attempt-corner'
import { strings } from '@/i18n'
import { CornerButton } from '@/ui/corner-button'
import { color } from '@/ui/theme'

const MODELING_BAR_HEIGHT = 3

interface ParentControlsProps {
  isModeling: boolean
  onAttempt: () => void
  /** A recorded attempt, as the temporary file the recorder wrote and how long it lasted. */
  onAttemptRecorded: (uri: string, durationMs: number) => void
  onToggleModeling: () => void
}

/**
 * Two faint controls in the bottom corners, meant for the parent (SPEC §2). The speech bubble credits an attempt of the
 * child to say the word when tapped, and records the attempt itself while it is held. The tapping hand switches on
 * modelling, which marks the next taps as the parent's own; while it is on, the hand is accent and a thin accent bar
 * runs along the bottom edge.
 */
export function ParentControls({
  isModeling,
  onAttempt,
  onAttemptRecorded,
  onToggleModeling,
}: ParentControlsProps): ReactElement {
  return (
    <>
      {isModeling && <View style={styles.modelingBar} />}
      <AttemptCorner
        hint={strings.requests.attemptHold}
        label={strings.requests.attempt}
        onCredit={onAttempt}
        onRecorded={onAttemptRecorded}
      />
      <CornerButton
        icon="hand.tap"
        isOn={isModeling}
        label={strings.requests.modeling}
        onPress={onToggleModeling}
        side="right"
      />
    </>
  )
}

const styles = StyleSheet.create({
  modelingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MODELING_BAR_HEIGHT,
    backgroundColor: color.accent,
    pointerEvents: 'none',
  },
})
