import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import type { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { strings } from '@/i18n'
import { color, space, touch, typography } from '@/ui/theme'

interface ParentScreenProps extends PropsWithChildren {
  title: string
  /** Parent home has no way back, only its own close button. */
  hasBack?: boolean
  /** Right end of the header: a badge, a label or an icon button. */
  accessory?: ReactNode
  /** Drawn behind everything, for the ornament. */
  background?: ReactNode
  /** Pinned under the scrolling content, for the screen's main action. */
  footer?: ReactNode
}

/**
 * A parent-mode screen after the mockups (DESIGN §3): a back chevron and a large title instead of the navigation bar,
 * then panels on the ground colour.
 */
export function ParentScreen({
  title,
  hasBack = true,
  accessory,
  background,
  footer,
  children,
}: ParentScreenProps): ReactElement {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.root}>
      {background}
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: footer ? space.parentPad : insets.bottom + space.parentPad,
            paddingLeft: insets.left + space.parentPad,
            paddingRight: insets.right + space.parentPad,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {hasBack && (
            <Pressable
              accessibilityLabel={strings.common.back}
              accessibilityRole="button"
              hitSlop={space.sm}
              onPress={() => router.back()}
              style={styles.back}
            >
              <SymbolView name="chevron.left" size={22} tintColor={color.accent} weight="semibold" />
            </Pressable>
          )}
          <Text accessibilityRole="header" numberOfLines={1} style={[typography.title, styles.title]}>
            {title}
          </Text>
          {accessory}
        </View>
        {children}
      </ScrollView>
      {footer && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, space.parentPad),
              paddingLeft: insets.left + space.parentPad,
              paddingRight: insets.right + space.parentPad,
            },
          ]}
        >
          {footer}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.ground,
  },
  content: {
    gap: space.parentPad,
  },
  header: {
    minHeight: touch.parent + space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  back: {
    width: touch.parent,
    height: touch.parent,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  footer: {
    paddingTop: space.sm,
  },
})
