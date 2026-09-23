import type { PropsWithChildren, ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { strings } from '@/i18n'
import { Panel } from '@/ui/panel'
import { color, font, space, typography } from '@/ui/theme'

const MARK_SIZE = 28

interface SessionGuideProps {
  /**
   * Whether every part stands on a panel of its own. The screen that is nothing but the script does that, so seven
   * steps are seven things to read rather than one wall; inside the onboarding step the script stays flat, since it is
   * already on a panel there.
   */
  hasPanels?: boolean
}

interface PartProps extends PropsWithChildren {
  hasPanel: boolean
}

/**
 * The script of a session (SPEC §5): what the app is for in one paragraph, then the seven steps the parent follows.
 * It is a screen of its own and, unchanged, the third step of the onboarding.
 */
export function SessionGuide({ hasPanels = false }: SessionGuideProps): ReactElement {
  return (
    <View style={hasPanels ? styles.parts : styles.guide}>
      <Part hasPanel={hasPanels}>
        <Text style={styles.model}>{strings.sessionGuide.model}</Text>
      </Part>
      {strings.sessionGuide.steps.map((step, index) => (
        <Part hasPanel={hasPanels} key={step.title}>
          <View style={styles.step}>
            <View style={styles.mark}>
              <Text style={styles.markNumber}>{index + 1}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.text}>{step.text}</Text>
            </View>
          </View>
        </Part>
      ))}
    </View>
  )
}

function Part({ hasPanel, children }: PartProps): ReactElement {
  if (!hasPanel) {
    return <>{children}</>
  }

  return <Panel>{children}</Panel>
}

const styles = StyleSheet.create({
  guide: {
    gap: space.lg,
  },
  parts: {
    gap: space.md,
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
