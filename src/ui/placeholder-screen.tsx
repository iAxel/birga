import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { strings } from '@/i18n'
import { colors, typography } from '@/ui/theme'

/** Body of a screen that a later build step fills in. */
export function PlaceholderScreen(): ReactElement {
  return (
    <View style={styles.root}>
      <Text style={typography.caption}>{strings.common.comingSoon}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
