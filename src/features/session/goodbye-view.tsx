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
import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { Ornaments } from '@/ui/ornaments'
import { color, font } from '@/ui/theme'

const LOOK: Record<FormFactor, { hand: number; handGap: number; word: number; tracking: number; subtitle: number }> = {
  tablet: {
    hand: 144,
    handGap: 40,
    word: 160,
    tracking: -5,
    subtitle: 26,
  },
  phone: {
    hand: 96,
    handGap: 28,
    word: 104,
    tracking: -3.5,
    subtitle: 19,
  },
}

const WAVE_STEP_MS = 250

const WAVE_EASING = Easing.bezier(0.77, 0, 0.175, 1)

/**
 * End of a session (SPEC §4): a waving hand, "Xayr!" and "Ertaga yana o'ynaymiz". The first time the child sees it
 * after a session, the hand waves once (about 1 s) and the parent's "Xayr!" plays; then it stays still.
 */
export function GoodbyeView(): ReactElement {
  const isFocused = useIsFocused()
  const session = useSession()
  const settings = useSettings()
  const player = useVoicePlayer()
  const look = LOOK[useFormFactor()]
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
      <Ornaments largeOpacity={0.45} smallOpacity={0.36} />
      <Animated.View
        style={[
          styles.hand,
          {
            marginBottom: look.handGap,
          },
          handStyle,
        ]}
      >
        <SymbolView name="hand.wave" size={look.hand} tintColor={color.accent} />
      </Animated.View>
      <Text
        style={[
          styles.word,
          {
            fontSize: look.word,
            letterSpacing: look.tracking,
          },
        ]}
      >
        {strings.child.goodbye}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            fontSize: look.subtitle,
          },
        ]}
      >
        {strings.child.goodbyeSubtitle}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.ground,
  },
  hand: {
    transformOrigin: '50% 85%',
  },
  word: {
    color: color.ink,
    fontFamily: font.extraBold,
  },
  subtitle: {
    color: color.muted,
    fontFamily: font.medium,
    textAlign: 'center',
  },
})
