import { useFocusEffect } from 'expo-router'
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Easing, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { stopVoice, useIsVoicePlaying, useVoicePlayer } from '@/audio/use-voice-player'
import { type Card, type CardsPerScreen, mediaUri } from '@/db'
import { gridShape, layoutGrid, type Rect, type Size } from '@/features/requests/board-layout'
import { EnlargedCard } from '@/features/requests/enlarged-card'
import { RequestCard } from '@/features/requests/request-card'
import { decideTap, ENLARGED_MS } from '@/features/requests/request-gate'
import { useEventLog } from '@/features/session/use-event-log'

/** DESIGN §4: 300 ms ease-out, no springs. */
const MOVE_MS = 300

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)

interface RequestsBoardProps {
  cards: Card[]
  cardsPerScreen: CardsPerScreen
  debounceMs: number
  /** Space between the cards and around them. */
  gap: number
  isModeling: boolean
  onPlayed: (cardId: number) => void
}

interface ActiveRequest {
  card: Card
  slot: Rect
}

/**
 * The child's board (SPEC §2): cards in fixed slots, one request at a time. A played card moves to the middle over the
 * dimmed board, its recording plays once, and it returns after ENLARGED_MS or when the recording ends, whichever is later.
 */
export function RequestsBoard({
  cards,
  cardsPerScreen,
  debounceMs,
  gap,
  isModeling,
  onPlayed,
}: RequestsBoardProps): ReactElement {
  const logEvent = useEventLog()
  const player = useVoicePlayer()
  const isPlaying = useIsVoicePlaying(player)
  const reduceMotion = useReducedMotion()
  const progress = useSharedValue(0)
  const [area, setArea] = useState<Size | null>(null)
  const [active, setActive] = useState<ActiveRequest | null>(null)
  const [isHoldOver, setIsHoldOver] = useState(false)
  const lastPlayedAtRef = useRef(new Map<number, number>())
  const isReturningRef = useRef(false)

  function release(): void {
    isReturningRef.current = false

    setIsHoldOver(false)
    setActive(null)
  }

  useEffect(() => {
    if (!active) {
      return
    }

    const timeout = setTimeout(() => setIsHoldOver(true), ENLARGED_MS)

    return () => clearTimeout(timeout)
  }, [active])

  /** The board keeps its screen: leaving the tab silences it, so it never plays under the pause game. */
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopVoice(player)

        progress.set(0)
        release()
      }
    }, [player, progress]),
  )

  useEffect(() => {
    if (!active || !isHoldOver || isPlaying || isReturningRef.current) {
      return
    }

    isReturningRef.current = true

    progress.set(
      withTiming(
        0,
        {
          duration: MOVE_MS,
          easing: EASE_OUT,
        },
        (finished) => {
          'worklet'

          if (finished) {
            scheduleOnRN(release)
          }
        },
      ),
    )
  }, [active, isHoldOver, isPlaying, progress])

  function tap(card: Card, slot: Rect, now: number): void {
    const decision = decideTap({
      cardId: card.id,
      now,
      isBoardBusy: active !== null,
      isModeling,
      lastPlayedAt: lastPlayedAtRef.current.get(card.id),
      debounceMs,
    })

    if (decision.event) {
      logEvent(decision.event)
    }

    if (!decision.play) {
      return
    }

    if (decision.event?.type === 'request_tap') {
      lastPlayedAtRef.current.set(card.id, now)
    }

    onPlayed(card.id)

    player.replace({
      uri: mediaUri(card.audioPath),
    })
    player.play()

    setActive({
      card,
      slot,
    })

    progress.set(
      withTiming(1, {
        duration: MOVE_MS,
        easing: EASE_OUT,
      }),
    )
  }

  const slots = area ? layoutGrid(area, gridShape(cardsPerScreen, area), gap) : []
  /** Where the played card belongs now: the board is laid out again when the iPad is turned, and its slot moves with it. */
  const activeSlot = (active ? slots[cards.findIndex((card) => card.id === active.card.id)] : undefined) ?? active?.slot

  return (
    <View
      onLayout={(event) =>
        setArea({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        })
      }
      style={styles.board}
    >
      {slots.map((slot, index) => {
        const card = cards[index]

        if (!card) {
          return null
        }

        return (
          <Pressable
            accessibilityLabel={card.text}
            accessibilityRole="button"
            key={card.id}
            onPress={() => tap(card, slot, Date.now())}
            style={[
              styles.slot,
              {
                left: slot.x,
                top: slot.y,
              },
              active?.card.id === card.id && styles.hidden,
            ]}
          >
            <RequestCard card={card} size={slot} />
          </Pressable>
        )
      })}
      {active && area && activeSlot && (
        <EnlargedCard
          area={area}
          card={active.card}
          isPlaying={isPlaying}
          onPress={() => tap(active.card, activeSlot, Date.now())}
          progress={progress}
          reduceMotion={reduceMotion}
          slot={activeSlot}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
  },
  slot: {
    position: 'absolute',
  },
  hidden: {
    opacity: 0,
  },
})
