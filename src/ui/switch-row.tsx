import type { ReactElement } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'
import { color, space, typography } from '@/ui/theme'

interface SwitchRowProps {
  title: string
  value: boolean
  onChange: (value: boolean) => void
}

/** A setting that is simply on or off. */
export function SwitchRow({ title, value, onChange }: SwitchRowProps): ReactElement {
  return (
    <View style={styles.row}>
      <Text style={[typography.row, styles.title]}>{title}</Text>
      <Switch
        onValueChange={onChange}
        thumbColor={color.card}
        trackColor={{
          false: color.hint,
          true: color.accent,
        }}
        value={value}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  title: {
    flex: 1,
  },
})
