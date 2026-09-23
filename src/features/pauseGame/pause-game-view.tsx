import { Image } from 'expo-image'
import { useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { type ReactElement, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useVoicePlayer } from '@/audio/use-voice-player'
import { mediaUri, type SequenceItem } from '@/db'
import {
  afterItem,
  afterPause,
  isGameOver,
  MAX_ROUNDS,
  MIN_SEQUENCE_ITEMS,
  nextPausePosition,
  type RoundState,
  startRound,
} from '@/features/pauseGame/pause-round'
import { Reward } from '@/features/pauseGame/reward'
import { usePauseSequence } from '@/features/pauseGame/use-pause-sequence'
import { useEventLog } from '@/features/session/use-event-log'
import { useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { CornerButton } from '@/ui/corner-button'
import { fontForText } from '@/ui/fonts'
import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { color, font, space, touch, typography } from '@/ui/theme'

/** A breath between two items, so the sequence does not run together. */
const ITEM_GAP_MS = 350

/** How long the finished sequence stays on screen before the next round starts. */
const ROUND_GAP_MS = 1400

const DOT_SIZE = 12

const IMAGE_SIZE = 160

const START_ICON_SIZE = 56

/** Text sizes of the pause game (DESIGN §1). */
const LOOK: Record<FormFactor, { symbol: number; word: number; saidSymbol: number; saidWord: number }> = {
  tablet: {
    symbol: 220,
    word: 64,
    saidSymbol: 64,
    saidWord: 26,
  },
  phone: {
    symbol: 180,
    word: 52,
    saidSymbol: 44,
    saidWord: 18,
  },
}

/**
 * The pause game (SPEC §3): the app says a sequence the child knows in the parent's voice and stops before one item.
 * The item waits as a grey hint; the parent can credit a sound the child made, and either way the app says the item
 * itself and carries on. Five rounds at most, then the screen holds still until the next session.
 *
 * There is no microphone here yet: the pause ends on the parent's button or when its time is up (build step 7).
 */
export function PauseGameView(): ReactElement {
  const settings = useSettings()
  const logEvent = useEventLog()
  const player = useVoicePlayer()
  const items = usePauseSequence()
  const look = LOOK[useFormFactor()]
  const [state, setState] = useState<RoundState | null>(null)
  const [roundsPlayed, setRoundsPlayed] = useState(0)
  const [saidCount, setSaidCount] = useState(0)
  const [filledAt, setFilledAt] = useState<number | null>(null)
  const previousPauseRef = useRef<number | null>(null)
  const isOver = roundsPlayed >= MAX_ROUNDS

  function beginRound(round: number): void {
    if (!items) {
      return
    }

    const pauseAt = nextPausePosition(items.length, previousPauseRef.current, Math.random())

    previousPauseRef.current = pauseAt

    setFilledAt(null)
    setSaidCount(0)
    setState(startRound(round, pauseAt))
  }

  /** The word appears at the moment it is said, not a moment before or after it. */
  const sayItem = useEffectEvent((item: SequenceItem, index: number) => {
    if (!item.audioPath) {
      return
    }

    player.replace({
      uri: mediaUri(item.audioPath),
    })
    player.play()

    setSaidCount(index + 1)
  })

  const goOn = useEffectEvent(() => {
    setState((current) => (current && items ? afterItem(current, items.length) : current))
  })

  const openPause = useEffectEvent((item: SequenceItem) => {
    logEvent({
      type: 'pause_open',
      sequenceId: item.sequenceId,
      itemPosition: item.position,
    })
  })

  /** The pause ran out: the same ending as a filled one, only without the reward. */
  const timeOutPause = useEffectEvent((item: SequenceItem) => endPause(false, item))

  function endPause(wasFilled: boolean, item: SequenceItem): void {
    logEvent({
      type: wasFilled ? 'pause_parent_credit' : 'pause_timeout',
      sequenceId: item.sequenceId,
      itemPosition: item.position,
    })

    if (wasFilled) {
      setFilledAt(Date.now())
    }

    setState((current) => (current ? afterPause(current, wasFilled) : current))
  }

  const logRoundEnd = useEffectEvent((current: RoundState) => {
    logEvent({
      type: 'game_round_end',
      payload: {
        round: current.round,
        filled: current.wasFilled,
      },
    })
  })

  /** A round is counted once it is over; the next one follows unless this was the fifth. */
  const concludeRound = useEffectEvent((current: RoundState) => {
    setRoundsPlayed(current.round)

    if (!isGameOver(current)) {
      beginRound(current.round + 1)
    }
  })

  useEffect(() => {
    if (!state || !items || state.phase !== 'saying') {
      return
    }

    const item = items[state.index]

    if (!item) {
      return
    }

    const timeout = setTimeout(() => sayItem(item, state.index), ITEM_GAP_MS)

    return () => clearTimeout(timeout)
  }, [state, items])

  /** The player tells when an item has been said; the round moves on from there, not from a timer of our own. */
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        goOn()
      }
    })

    return () => subscription.remove()
  }, [player, items])

  useEffect(() => {
    if (!state || !items || state.phase !== 'waiting') {
      return
    }

    const item = items[state.pauseAt]

    if (!item) {
      return
    }

    openPause(item)

    const timeout = setTimeout(() => timeOutPause(item), settings.pauseWindowSeconds * 1000)

    return () => clearTimeout(timeout)
  }, [state, items, settings.pauseWindowSeconds])

  useEffect(() => {
    if (!state || state.phase !== 'finished') {
      return
    }

    logRoundEnd(state)

    const timeout = setTimeout(() => concludeRound(state), ROUND_GAP_MS)

    return () => clearTimeout(timeout)
  }, [state])

  /** Leaving the tab stops the game where it is: the voice falls silent and the play button comes back. */
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (player.playing) {
          player.pause()
        }

        setState(null)
      }
    }, [player]),
  )

  function credit(): void {
    if (!state || !items || state.phase !== 'waiting') {
      return
    }

    endPause(true, items[state.pauseAt])
  }

  if (!items || items.length < MIN_SEQUENCE_ITEMS) {
    return (
      <View style={styles.root}>
        <Text style={styles.empty}>{strings.pauseGame.empty}</Text>
      </View>
    )
  }

  if (state === null) {
    return (
      <View style={styles.root}>
        <Pressable
          accessibilityLabel={strings.pauseGame.start}
          accessibilityRole="button"
          disabled={isOver}
          onPress={() => beginRound(roundsPlayed + 1)}
          style={[styles.start, isOver && styles.startOver]}
        >
          <SymbolView name="play.fill" size={START_ICON_SIZE} tintColor={isOver ? color.hint : color.accent} />
        </Pressable>
      </View>
    )
  }

  const said = state ? items.slice(0, Math.min(saidCount, state.pauseAt)) : []
  const hint = state && state.index >= state.pauseAt ? items[state.pauseAt] : null
  const isAnswered = state !== null && state.phase !== 'waiting' && state.index >= state.pauseAt

  return (
    <View style={styles.root}>
      <View style={styles.said}>
        {said.map((item) => (
          <View key={item.id} style={styles.saidItem}>
            {item.symbol && (
              <Text style={[styles.saidSymbol, { fontSize: look.saidSymbol }, fontForText(item.symbol, font.extraBold)]}>
                {item.symbol}
              </Text>
            )}
            <Text style={[styles.saidWord, { fontSize: look.saidWord }, fontForText(item.text, font.semiBold)]}>
              {item.text}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.hint}>
        <Reward filledAt={filledAt} hasGlow={settings.rewardGlow} hasSparks={settings.rewardSparks} />
        {hint?.imagePath && (
          <Image
            contentFit="contain"
            source={{
              uri: mediaUri(hint.imagePath),
            }}
            style={styles.image}
          />
        )}
        {hint?.symbol && (
          <Text
            style={[
              styles.symbol,
              isAnswered && styles.answered,
              { fontSize: look.symbol },
              fontForText(hint.symbol, font.extraBold),
            ]}
          >
            {hint.symbol}
          </Text>
        )}
        {hint && (
          <Text
            style={[styles.word, isAnswered && styles.answered, { fontSize: look.word }, fontForText(hint.text, font.bold)]}
          >
            {hint.text}
          </Text>
        )}
        <WaitingMark isAnswered={isAnswered} isWaiting={state?.phase === 'waiting'} />
      </View>
      <CornerButton
        hint={strings.pauseGame.creditHint}
        icon="bubble.left"
        isOn={filledAt !== null && state?.phase !== 'waiting'}
        label={strings.pauseGame.credit}
        onPress={credit}
        side="left"
      />
    </View>
  )
}

interface WaitingMarkProps {
  isWaiting: boolean
  isAnswered: boolean
}

/** Three dots while the child's turn lasts, a check once the pause was filled, nothing in between. */
function WaitingMark({ isWaiting, isAnswered }: WaitingMarkProps): ReactElement | null {
  const isStill = useReducedMotion()
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (!isWaiting || isStill) {
      pulse.set(1)

      return
    }

    pulse.set(
      withRepeat(
        withTiming(0.35, {
          duration: 700,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      ),
    )
  }, [isWaiting, isStill, pulse])

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: pulse.get(),
  }))

  if (isAnswered) {
    return <SymbolView name="checkmark" size={28} tintColor={color.rewardInk} weight="bold" />
  }

  if (!isWaiting) {
    return null
  }

  return (
    <Animated.View style={[styles.dots, dotsStyle]}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxl,
    backgroundColor: color.ground,
  },
  said: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.lg,
  },
  saidItem: {
    alignItems: 'center',
  },
  saidSymbol: {
    color: color.muted,
  },
  saidWord: {
    color: color.muted,
  },
  hint: {
    alignItems: 'center',
    gap: space.sm,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  symbol: {
    color: color.hint,
    letterSpacing: -5,
  },
  word: {
    color: color.hint,
    letterSpacing: -1,
  },
  answered: {
    color: color.ink,
  },
  dots: {
    flexDirection: 'row',
    gap: space.md,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: color.hint,
  },
  startOver: {
    backgroundColor: color.panelAlt,
  },
  start: {
    width: touch.child,
    height: touch.child,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touch.child / 2,
    backgroundColor: color.accentBg,
  },
  empty: {
    ...typography.row,
    color: color.hint,
    paddingHorizontal: space.xxl,
    textAlign: 'center',
  },
})
