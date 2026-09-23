import { type ReactElement, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useVoiceRecorder } from '@/audio/use-voice-recorder'
import { strings } from '@/i18n'
import { CornerButton } from '@/ui/corner-button'
import { color } from '@/ui/theme'

/** How long the attempt icon stays lit, so the parent sees the tap counted. */
const ATTEMPT_NOTED_MS = 800

/** Held longer than this, the attempt control records instead of crediting a tap. */
const HOLD_TO_RECORD_MS = 400

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
  const [isAttemptNoted, setIsAttemptNoted] = useState(false)
  const recorder = useVoiceRecorder((uri, _levels, durationMs) => onAttemptRecorded(uri, durationMs), {
    askOnMount: false,
  })
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAttemptNoted) {
      return
    }

    const timeout = setTimeout(() => setIsAttemptNoted(false), ATTEMPT_NOTED_MS)

    return () => clearTimeout(timeout)
  }, [isAttemptNoted])

  useEffect(() => {
    return () => clearTimeout(holdRef.current ?? undefined)
  }, [])

  function startHold(): void {
    holdRef.current = setTimeout(() => {
      holdRef.current = null

      recorder.start()
    }, HOLD_TO_RECORD_MS)
  }

  /** Let go before the hold turned into a recording: that was a tap, and a tap credits the attempt. */
  function endHold(): void {
    if (holdRef.current !== null) {
      clearTimeout(holdRef.current)

      holdRef.current = null

      onAttempt()

      setIsAttemptNoted(true)

      return
    }

    recorder.stop()
  }

  return (
    <>
      {isModeling && <View style={styles.modelingBar} />}
      <CornerButton
        hint={strings.requests.attemptHold}
        icon="bubble.left"
        isOn={isAttemptNoted || recorder.isRecording}
        label={strings.requests.attempt}
        onPressIn={startHold}
        onPressOut={endHold}
        side="left"
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
