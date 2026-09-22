import type { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { strings } from '@/i18n'
import { colors, typography } from '@/ui/theme'

/** End of a session: a static calm screen, nothing on it reacts to touch except the parent gate (SPEC §4). */
export default function GoodbyeScreen(): ReactElement {
  return (
    <View style={styles.root}>
      <Text style={typography.cardWord}>{strings.child.goodbye}</Text>
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
