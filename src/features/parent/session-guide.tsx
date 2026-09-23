import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { strings } from '@/i18n'
import { color, font, space, typography } from '@/ui/theme'

const MARK_SIZE = 28

/**
 * The script of a session (SPEC §5): what the app is for in one paragraph, then the seven steps the parent follows.
 * It is a screen of its own and, unchanged, the third step of the onboarding.
 */
export function SessionGuide(): ReactElement {
  return (
    <View style={styles.guide}>
      <Text style={styles.model}>{strings.sessionGuide.model}</Text>
      {strings.sessionGuide.steps.map((step, index) => (
        <View key={step.title} style={styles.step}>
          <View style={styles.mark}>
            <Text style={styles.markNumber}>{index + 1}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.text}>{step.text}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  guide: {
    gap: space.lg,
  },
  model: {
    color: color.ink,
    fontFamily: font.medium,
    fontSize: 17,
    lineHeight: 25,
  },
  step: {
    flexDirection: 'row',
    gap: space.md,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: color.cardLine,
    borderRadius: MARK_SIZE / 2,
  },
  markNumber: {
    ...typography.button,
    color: color.muted,
    fontSize: 14,
  },
  body: {
    flex: 1,
    gap: space.xs,
  },
  title: {
    ...typography.row,
    fontFamily: font.bold,
  },
  text: {
    color: color.muted,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 23,
  },
})
