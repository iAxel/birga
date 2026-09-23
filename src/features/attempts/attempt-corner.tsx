import { type ReactElement, useEffect, useRef, useState } from 'react'
import { useVoiceRecorder } from '@/audio/use-voice-recorder'
import { CornerButton } from '@/ui/corner-button'

/** How long the attempt icon stays lit, so the parent sees the tap counted. */
const NOTED_MS = 800

/** Held longer than this, the control records instead of crediting a tap. */
const HOLD_TO_RECORD_MS = 400

interface AttemptCornerProps {
  label: string
  hint: string
  /** Lit for a reason of the screen's own, e.g. a pause the parent has just credited. */
  isOn?: boolean
  /** A tap: the child made a sound, and the screen decides what that means for it. */
  onCredit: () => void
  /** A hold: the recorder wrote a take, as a temporary file and how long it lasted. */
  onRecorded: (uri: string, durationMs: number) => void
}

/**
 * The parent's attempt control in the bottom-left corner of a child screen (SPEC §2, §3). A tap credits a sound of the
 * child, holding it records the sound itself, up to four seconds. It is small on purpose: the child is not meant to
 * aim for it.
 */
export function AttemptCorner({ label, hint, isOn = false, onCredit, onRecorded }: AttemptCornerProps): ReactElement {
  const [isNoted, setIsNoted] = useState(false)
  const recorder = useVoiceRecorder((uri, _levels, durationMs) => onRecorded(uri, durationMs), {
    askOnMount: false,
  })
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isNoted) {
      return
    }

    const timeout = setTimeout(() => setIsNoted(false), NOTED_MS)

    return () => clearTimeout(timeout)
  }, [isNoted])

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

      onCredit()

      setIsNoted(true)

      return
    }

    recorder.stop()
  }

  return (
    <CornerButton
      hint={hint}
      icon="bubble.left"
      isOn={isOn || isNoted || recorder.isRecording}
      label={label}
      onPressIn={startHold}
      onPressOut={endHold}
      side="left"
    />
  )
}
