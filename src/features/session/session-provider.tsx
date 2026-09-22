import {
  createContext,
  type PropsWithChildren,
  type ReactElement,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from 'react'
import { useRepositories } from '@/db'
import {
  breakLeftMs,
  pauseClock,
  remainingMs,
  resumeClock,
  type SessionClock,
  startClock,
} from '@/features/session/session-clock'
import { useSettings } from '@/features/settings/settings-provider'

const MINUTE_MS = 60_000

export interface ActiveSession {
  id: number
  clock: SessionClock
}

interface SessionContextValue {
  active: ActiveSession | null
  /** The session that ended last in this run of the app; the goodbye screen says goodbye once for each. */
  lastEndedSessionId: number | null
  /** How much longer the minimum break blocks a new session, as of `now`. */
  breakLeftMs: (now: number) => number
  start: (now: number) => Promise<void>
  end: (reason: 'timer' | 'parent_exit', now: number) => Promise<void>
  pause: (now: number) => void
  resume: (now: number) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Sessions of child play (SPEC §4). Only the parent starts one; parent mode pauses it; it ends when its time is up or the
 * parent ends it. Sessions the app died in are closed before anything renders, so the app always opens without one.
 */
export function SessionProvider({ children }: PropsWithChildren): ReactElement | null {
  const repositories = useRepositories()
  const settings = useSettings()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [active, setActive] = useState<ActiveSession | null>(null)
  const [lastTimerEndedAt, setLastTimerEndedAt] = useState<number | null>(null)
  const [lastEndedSessionId, setLastEndedSessionId] = useState<number | null>(null)

  useEffect(() => {
    async function prepare(): Promise<void> {
      await repositories.sessions.closeInterrupted()

      setLastTimerEndedAt(await repositories.sessions.lastTimerEndedAt())
      setIsReady(true)
    }

    prepare().catch(setError)
  }, [repositories])

  const onTimeUp = useEffectEvent(() => {
    end('timer', Date.now())
  })

  useEffect(() => {
    if (!active || active.clock.pausedAt !== null) {
      return
    }

    const timeout = setTimeout(onTimeUp, remainingMs(active.clock, Date.now()))

    return () => clearTimeout(timeout)
  }, [active])

  async function start(now: number): Promise<void> {
    if (active || breakLeft(now) > 0) {
      return
    }

    const id = await repositories.sessions.start(now)

    setActive({
      id,
      clock: startClock(now, settings.sessionMinutes * MINUTE_MS),
    })
  }

  async function end(reason: 'timer' | 'parent_exit', now: number): Promise<void> {
    if (!active) {
      return
    }

    setActive(null)
    setLastEndedSessionId(active.id)

    if (reason === 'timer') {
      setLastTimerEndedAt(now)
    }

    await repositories.sessions.end(active.id, reason, now)
  }

  function pause(now: number): void {
    setActive(
      (current) =>
        current && {
          ...current,
          clock: pauseClock(current.clock, now),
        },
    )
  }

  function resume(now: number): void {
    setActive(
      (current) =>
        current && {
          ...current,
          clock: resumeClock(current.clock, now),
        },
    )
  }

  function breakLeft(now: number): number {
    return breakLeftMs(lastTimerEndedAt, settings.minBreakMinutes * MINUTE_MS, now)
  }

  if (error) {
    throw error
  }

  if (!isReady) {
    return null
  }

  return (
    <SessionContext
      value={{
        active,
        lastEndedSessionId,
        breakLeftMs: breakLeft,
        start,
        end,
        pause,
        resume,
      }}
    >
      {children}
    </SessionContext>
  )
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)

  if (!value) {
    throw new Error('SESSION_PROVIDER_MISSING')
  }

  return value
}
