import { useIsFocused } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { type ReactElement, useEffect, useEffectEvent, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useVoicePlayer } from '@/audio/use-voice-player'
import { mediaUri } from '@/db'
import { useSession } from '@/features/session/session-provider'
import { useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { colors, spacing, typography } from '@/ui/theme'

const HAND_SIZE = 120

const WAVE_STEP_MS = 250

const WAVE_EASING = Easing.bezier(0.77, 0, 0.175, 1)

/**
 * End of a session (SPEC §4). The first time the child sees it after a session, the hand waves once (about 1 s) and the
 * parent's "Xayr!" plays; then it stays still with the word. When the app opens without a session, only the hand is shown.
 */
export function GoodbyeView(): ReactElement {
  const isFocused = useIsFocused()
  const session = useSession()
  const settings = useSettings()
  const player = useVoicePlayer()
  const reduceMotion = useReducedMotion()
  const rotation = useSharedValue(0)
  const saidGoodbyeForRef = useRef<number | null>(null)

  const handStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${rotation.get()}deg`,
      },
    ],
  }))

  const sayGoodbye = useEffectEvent((sessionId: number) => {
    saidGoodbyeForRef.current = sessionId

    if (settings.goodbyeAudioPath) {
      player.replace({
        uri: mediaUri(settings.goodbyeAudioPath),
      })
      player.play()
    }

    if (reduceMotion) {
      return
    }

    rotation.set(
      withSequence(
        withTiming(16, {
          duration: WAVE_STEP_MS,
          easing: WAVE_EASING,
        }),
        withTiming(-12, {
          duration: WAVE_STEP_MS,
          easing: WAVE_EASING,
        }),
        withTiming(16, {
          duration: WAVE_STEP_MS,
          easing: WAVE_EASING,
        }),
        withTiming(0, {
          duration: WAVE_STEP_MS,
          easing: WAVE_EASING,
        }),
      ),
    )
  })

  useEffect(() => {
    const sessionId = session.lastEndedSessionId

    if (isFocused && sessionId !== null && sessionId !== saidGoodbyeForRef.current) {
      sayGoodbye(sessionId)
    }
  }, [isFocused, session.lastEndedSessionId])

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.hand, handStyle]}>
        <SymbolView name="hand.wave.fill" size={HAND_SIZE} tintColor={colors.accent} />
      </Animated.View>
      {session.lastEndedSessionId !== null && <Text style={typography.cardWord}>{strings.child.goodbye}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  hand: {
    transformOrigin: '50% 85%',
  },
})
