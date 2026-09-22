import { type Href, Link } from 'expo-router'
import type { ReactElement } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { SessionControls } from '@/features/session/session-controls'
import { strings } from '@/i18n'
import { colors, radii, spacing, touch, typography } from '@/ui/theme'

interface Section {
  href: Href
  title: string
}

const SECTIONS: Section[] = [
  {
    href: '/cards',
    title: strings.parent.cards,
  },
  {
    href: '/sequences',
    title: strings.parent.sequences,
  },
  {
    href: '/settings',
    title: strings.parent.settings,
  },
  {
    href: '/log',
    title: strings.parent.log,
  },
]

/** Parent mode home: the session, the sections of parent mode and the Guided Access advice. */
export default function ParentHomeScreen(): ReactElement {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SessionControls />
      {SECTIONS.map((section) => (
        <Link asChild href={section.href} key={section.title}>
          <Pressable style={styles.row}>
            <Text style={typography.body}>{section.title}</Text>
          </Pressable>
        </Link>
      ))}
      <Text style={[typography.caption, styles.hint]}>{strings.parent.guidedAccessHint}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  row: {
    minHeight: touch.parent,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  hint: {
    marginVertical: spacing.lg,
  },
})
