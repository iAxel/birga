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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MAX_AUDIO_MS } from '@/audio/audio-file'
import { deleteTake } from '@/audio/takes'
import { useVocalizationListener } from '@/audio/use-vocalization-listener'
import { stopVoice, useVoicePlayer } from '@/audio/use-voice-player'
import { FIRST_MEASURE_MS, ROUND_MEASURE_MS } from '@/audio/vocalization'
import { type EventInput, type EventType, mediaUri, type SequenceItem } from '@/db'
import { AttemptCorner } from '@/features/attempts/attempt-corner'
import { useSaveAttempt } from '@/features/attempts/use-save-attempt'
import {
  afterItem,
  afterPause,
  isGameOver,
  MIN_SEQUENCE_ITEMS,
  nextPausePosition,
  type RoundState,
  startRound,
} from '@/features/pauseGame/pause-round'
import { Reward } from '@/features/pauseGame/reward'
import { usePauseSequence } from '@/features/pauseGame/use-pause-sequence'
import { useEventLog } from '@/features/session/use-event-log'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { fontForText } from '@/ui/fonts'
import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { color, font, space, touch, typography } from '@/ui/theme'

/** A breath between two items, so the sequence does not run together. */
const ITEM_GAP_MS = 350

/**
 * The breath after the item the pause was about, filled or not. The app has just said the word the child was given
 * room for, and this is the moment he is most likely to say it after it: the sequence waits before carrying on.
 */
const AFTER_PAUSE_GAP_MS = 1000

/** The microphone opens this long after the app has stopped speaking, so it never hears the app itself (SPEC §3). */
const MIC_GUARD_MS = 150

/** How long the finished sequence stays on screen before the next round starts. */
const ROUND_GAP_MS = 1400

/**
 * How much longer than its breath and its recording an item may take before the round moves on without being told that
 * it ended. A recording lasts at most MAX_AUDIO_MS, so anything past that is a file the player never finished: silence
 * would otherwise hold the round.
 */
const SAYING_SLACK_MS = MAX_AUDIO_MS + 600

/** SPEC §6: which event a pause ending writes, by what ended it. */
const PAUSE_END_EVENT = {
  detected: 'pause_filled',
  parent: 'pause_parent_credit',
  timeout: 'pause_timeout',
} as const

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
 * itself and carries on. A game gives as many rounds as the setting says, then the screen holds still until the next
 * session.
 *
 * During the pause the microphone listens for a sound of the child (SPEC §3): it opens once the app has fallen silent,
 * measures the room, and closes again before the app speaks. Nothing it hears is kept.
 */
export function PauseGameView(): ReactElement {
  const insets = useSafeAreaInsets()
  const settings = useSettings()
  const saveSetting = useSaveSetting()
  const logEvent = useEventLog()
  const saveAttempt = useSaveAttempt()
  const player = useVoicePlayer()
  const listener = useVocalizationListener(settings.detectionMarginDb, settings.roomBaselineDb, keepRoom)
  const items = usePauseSequence()
  const look = LOOK[useFormFactor()]
  const [state, setState] = useState<RoundState | null>(null)
  const [roundsPlayed, setRoundsPlayed] = useState(0)
  const [saidCount, setSaidCount] = useState(0)
  const [filledAt, setFilledAt] = useState<number | null>(null)
  const previousPauseRef = useRef<number | null>(null)
  const stateRef = useRef<RoundState | null>(null)
  const isOver = roundsPlayed >= settings.roundsPerGame

  useEffect(() => {
    stateRef.current = state
  }, [state])

  /** The room the microphone measured, kept so the next session listens against it from its first pause. */
  function keepRoom(db: number): void {
    saveSetting('roomBaselineDb', Math.round(db * 10) / 10).catch(() => undefined)
  }

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
    logEvent(pauseEvent('pause_open', item))
  })

  /** The child (or the parent's hand on his) starts the game; the rounds after the first follow by themselves. */
  function startGame(): void {
    logEvent({
      type: 'game_start',
      payload: {
        round: roundsPlayed + 1,
      },
    })

    beginRound(roundsPlayed + 1)
  }

  /**
   * The pause ran out: the same ending as a filled one, only without the reward. Nothing was said into it, so what the
   * microphone heard is the room itself, and the next pause starts from that.
   */
  const timeOutPause = useEffectEvent((item: SequenceItem) => {
    listener.settle()

    endPause('timeout', item)
  })

  /** The microphone heard the child take his turn. */
  const fillPause = useEffectEvent((item: SequenceItem) => endPause('detected', item))

  function endPause(reason: 'detected' | 'parent' | 'timeout', item: SequenceItem): void {
    const wasFilled = reason !== 'timeout'

    logEvent(pauseEvent(PAUSE_END_EVENT[reason], item))

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

  /** The sequence lost the item the round was counting on: the parent edited it. Back to the play button. */
  const giveUpRound = useEffectEvent(() => setState(null))

  /** A round is counted once it is over; the next one follows unless this was the fifth, after which the tab rests. */
  const concludeRound = useEffectEvent((current: RoundState) => {
    setRoundsPlayed(current.round)

    if (isGameOver(current, settings.roundsPerGame)) {
      setState(null)

      return
    }

    beginRound(current.round + 1)
  })

  useEffect(() => {
    if (!state || !items || state.phase !== 'saying') {
      return
    }

    const item = items[state.index]

    if (!item) {
      const stop = setTimeout(giveUpRound, 0)

      return () => clearTimeout(stop)
    }

    const gap = state.index === state.pauseAt + 1 ? AFTER_PAUSE_GAP_MS : ITEM_GAP_MS
    const timeout = setTimeout(() => sayItem(item, state.index), gap)
    const watchdog = setTimeout(goOn, gap + SAYING_SLACK_MS)

    return () => {
      clearTimeout(timeout)
      clearTimeout(watchdog)
    }
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
      const stop = setTimeout(giveUpRound, 0)

      return () => clearTimeout(stop)
    }

    openPause(item)

    const opening = setTimeout(() => listener.listen(() => fillPause(item)), MIC_GUARD_MS)
    const timeout = setTimeout(() => timeOutPause(item), settings.pauseWindowSeconds * 1000)

    return () => {
      clearTimeout(opening)
      clearTimeout(timeout)

      listener.close()
    }
  }, [state, items, listener, settings.pauseWindowSeconds])

  /** A quiet moment: the game is not running, so the room can be measured before the first pause needs the value. */
  useEffect(() => {
    if (state !== null || isOver || !items) {
      return
    }

    listener.measure(FIRST_MEASURE_MS)

    return () => listener.close()
  }, [state, isOver, items, listener])

  /**
   * The sequence is over and the app falls silent until the next round: the one quiet moment inside a game, so the
   * room is measured again in it, and the baseline follows the room as it gets louder or quieter.
   */
  useEffect(() => {
    if (!state || state.phase !== 'finished') {
      return
    }

    logRoundEnd(state)

    const measuring = setTimeout(() => listener.measure(ROUND_MEASURE_MS), MIC_GUARD_MS)
    const timeout = setTimeout(() => concludeRound(state), ROUND_GAP_MS)

    return () => {
      clearTimeout(measuring)
      clearTimeout(timeout)

      listener.close()
    }
  }, [state, listener])

  /**
   * Leaving the tab stops the game where it is: the voice falls silent and the play button comes back. The round that
   * was interrupted still counts, otherwise five rounds could be stretched into a session without an end.
   */
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopVoice(player)
        listener.close()

        const current = stateRef.current

        if (current) {
          setRoundsPlayed((played) => Math.max(played, current.round))
        }

        setState(null)
      }
    }, [player, listener]),
  )

  /**
   * A sound of the child as the parent heard it, kept against the item the round is pausing on (SPEC §3). Without a
   * round there is nothing to keep it against, and the take goes.
   */
  function recordAttempt(uri: string, durationMs: number): void {
    const item = items?.[state?.pauseAt ?? -1]

    if (!item) {
      deleteTake(uri)

      return
    }

    saveAttempt(uri, durationMs, {
      sequenceId: item.sequenceId,
      itemPosition: item.position,
      word: item.text,
      itemId: item.id,
    }).catch(() => undefined)
  }

  function credit(): void {
    const item = state && items && state.phase === 'waiting' ? items[state.pauseAt] : undefined

    if (!item) {
      return
    }

    endPause('parent', item)
  }

  /** The tab bar floats over the screen, and the game leaves it, the notch and the corners their room. */
  const padding = {
    paddingTop: insets.top + space.lg,
    paddingBottom: insets.bottom + space.tabBar,
    paddingLeft: insets.left + space.lg,
    paddingRight: insets.right + space.lg,
  }

  if (!items || items.length < MIN_SEQUENCE_ITEMS) {
    return (
      <View style={[styles.root, padding]}>
        <Text style={styles.empty}>{strings.pauseGame.empty}</Text>
      </View>
    )
  }

  if (state === null) {
    return (
      <View style={[styles.root, padding]}>
        <Pressable
          accessibilityLabel={strings.pauseGame.start}
          accessibilityRole="button"
          disabled={isOver}
          onPress={startGame}
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
    <View style={[styles.root, padding]}>
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
      <AttemptCorner
        hint={strings.pauseGame.creditHint}
        isOn={filledAt !== null && state?.phase !== 'waiting'}
        label={strings.pauseGame.credit}
        onCredit={credit}
        onRecorded={recordAttempt}
      />
    </View>
  )
}

/** A pause event names its item by sequence and position, and keeps the item's word and id with it (SPEC §6). */
function pauseEvent(type: EventType, item: SequenceItem): EventInput {
  return {
    type,
    sequenceId: item.sequenceId,
    itemPosition: item.position,
    payload: {
      word: item.text,
      itemId: item.id,
    },
  }
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
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'center',
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
