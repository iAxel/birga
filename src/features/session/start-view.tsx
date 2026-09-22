import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { fontForText } from '@/ui/fonts'
import { type FormFactor, useFormFactor } from '@/ui/form-factor'
import { Ornaments } from '@/ui/ornaments'
import { color, font, space } from '@/ui/theme'

const LOOK: Record<FormFactor, { wordmark: number; tracking: number; subtitle: number; hint: number; hintGap: number }> = {
  tablet: {
    wordmark: 96,
    tracking: -3,
    subtitle: 26,
    hint: 16,
    hintGap: 56,
  },
  phone: {
    wordmark: 72,
    tracking: -2.5,
    subtitle: 19,
    hint: 14,
    hintGap: 40,
  },
}

/**
 * The calm screen the app opens on when no session runs (DESIGN §3, Start): the wordmark, "<child> bilan birga
 * o'ynaymiz" and a tiny note that the parent starts the session. Nothing on it reacts to touch except the parent gate.
 */
export function StartView(): ReactElement {
  const settings = useSettings()
  const look = LOOK[useFormFactor()]
  const name = settings.childName.trim()
  const subtitle = name ? strings.child.startSubtitle(name) : strings.child.startSubtitleNoName

  return (
    <View style={styles.root}>
      <Ornaments largeOpacity={0.6} smallOpacity={0.48} />
      <Text
        style={[
          styles.wordmark,
          {
            fontSize: look.wordmark,
            letterSpacing: look.tracking,
          },
        ]}
      >
        {strings.child.wordmark}
      </Text>
      <Text
        style={[
          styles.subtitle,
          fontForText(subtitle, font.medium),
          {
            fontSize: look.subtitle,
          },
        ]}
      >
        {subtitle}
      </Text>
      <Text
        style={[
          styles.hint,
          {
            marginTop: look.hintGap,
            fontSize: look.hint,
          },
        ]}
      >
        {strings.child.startHint}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    backgroundColor: color.ground,
  },
  wordmark: {
    color: color.ink,
    fontFamily: font.extraBold,
  },
  subtitle: {
    color: color.muted,
    textAlign: 'center',
  },
  hint: {
    color: color.hint,
    fontFamily: font.medium,
    textAlign: 'center',
  },
})
