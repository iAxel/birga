import { type ReactElement, useEffect, useRef, useState } from 'react'
import { useVoiceRecorder } from '@/audio/use-voice-recorder'
import type { AttemptTarget } from '@/features/attempts/use-save-attempt'
import { CornerButton } from '@/ui/corner-button'

/** How long the attempt icon stays lit, so the parent sees the tap counted. */
const NOTED_MS = 800

/** Held longer than this, the control records instead of crediting a tap. */
const HOLD_TO_RECORD_MS = 400

interface AttemptCornerProps {
  label: string
  hint: string
  /** A tap: the child made a sound. True when the screen counted it, which lights the corner for a moment. */
  onCredit: () => boolean
  /** What a recording started now would belong to; asked the moment a hold turns into one. */
  targetNow: () => AttemptTarget | null
  /** A hold: the recorder wrote a take, with what it belongs to as it stood when the hold began. */
  onRecorded: (uri: string, durationMs: number, target: AttemptTarget | null) => void
}

/**
 * The parent's attempt control in the bottom-left corner of a child screen (SPEC §2, §3). A tap credits a sound of the
 * child, holding it records the sound itself, up to four seconds. Without the microphone a hold credits the sound as a
 * tap would. It is small on purpose: the child is not meant to aim for it, and it reads raw touches, so the child's taps
 * on the board go on working while the parent holds it.
 */
export function AttemptCorner({ label, hint, onCredit, targetNow, onRecorded }: AttemptCornerProps): ReactElement {
  const [isNoted, setIsNoted] = useState(false)
  const targetRef = useRef<AttemptTarget | null>(null)
  /** The screen's latest idea of what an attempt is about, read when the hold turns into a recording 400 ms later. */
  const targetNowRef = useRef(targetNow)
  const recorder = useVoiceRecorder((uri, _levels, durationMs) => onRecorded(uri, durationMs, targetRef.current), {
    askOnMount: false,
  })
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** The hold could not turn into a recording, without the microphone: letting go credits it instead. */
  const isCreditHoldRef = useRef(false)

  useEffect(() => {
    if (!isNoted) {
      return
    }

    const timeout = setTimeout(() => setIsNoted(false), NOTED_MS)

    return () => clearTimeout(timeout)
  }, [isNoted])

  useEffect(() => {
    targetNowRef.current = targetNow
  }, [targetNow])

  useEffect(() => {
    return () => clearTimeout(holdRef.current ?? undefined)
  }, [])

  function credit(): void {
    if (onCredit()) {
      setIsNoted(true)
    }
  }

  function startHold(): void {
    isCreditHoldRef.current = false

    holdRef.current = setTimeout(() => {
      holdRef.current = null
      targetRef.current = targetNowRef.current()

      if (!recorder.start()) {
        isCreditHoldRef.current = true
      }
    }, HOLD_TO_RECORD_MS)
  }

  /** Let go before the hold turned into a recording: that was a tap, and a tap credits the attempt. */
  function endHold(isCancelled: boolean): void {
    if (holdRef.current !== null) {
      clearTimeout(holdRef.current)

      holdRef.current = null

      if (!isCancelled) {
        credit()
      }

      return
    }

    if (isCreditHoldRef.current) {
      isCreditHoldRef.current = false

      if (!isCancelled) {
        credit()
      }

      return
    }

    recorder.stop()
  }

  return (
    <CornerButton
      hint={hint}
      icon="bubble.left"
      isOn={isNoted || recorder.isRecording}
      label={label}
      onTouchDown={startHold}
      onTouchUp={endHold}
      side="left"
    />
  )
}
