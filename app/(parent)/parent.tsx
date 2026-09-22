import { type Href, Link, useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
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

/** Parent mode home: its sections, the Guided Access advice and the only way back to child mode. */
export default function ParentHomeScreen(): ReactElement {
  const router = useRouter()

  function backToChildMode(): void {
    if (router.canGoBack()) {
      router.back()

      return
    }

    router.replace('/requests')
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {SECTIONS.map((section) => (
        <Link asChild href={section.href} key={section.title}>
          <Pressable style={styles.row}>
            <Text style={typography.body}>{section.title}</Text>
          </Pressable>
        </Link>
      ))}
      <Text style={[typography.caption, styles.hint]}>{strings.parent.guidedAccessHint}</Text>
      <Pressable onPress={backToChildMode} style={styles.exit}>
        <Text style={[typography.body, styles.exitText]}>{strings.parent.backToChild}</Text>
      </Pressable>
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
    marginTop: spacing.lg,
  },
  exit: {
    minHeight: touch.parent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
  },
  exitText: {
    color: colors.accent,
    fontWeight: '600',
  },
})
