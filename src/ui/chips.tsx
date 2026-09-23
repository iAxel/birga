import type { ReactElement } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { color, radius, space, touch, typography } from '@/ui/theme'

interface ChipGroupProps<T extends string | number> {
  options: readonly T[]
  value: T
  label: (option: T) => string
  onChange: (option: T) => void
}

/** A row of choices, one of them picked: used wherever a setting has a handful of values (DESIGN §2, Parent mode). */
export function ChipGroup<T extends string | number>({ options, value, label, onChange }: ChipGroupProps<T>): ReactElement {
  return (
    <View style={styles.group}>
      {options.map((option) => {
        const isSelected = option === value

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{
              selected: isSelected,
            }}
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[typography.button, isSelected && styles.chipSelectedText]}>{label(option)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    minHeight: touch.parent,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderWidth: 1.5,
    borderColor: color.hint,
    borderRadius: radius.buttonSm,
  },
  chipSelected: {
    borderColor: color.accentBg,
    backgroundColor: color.accentBg,
  },
  chipSelectedText: {
    color: color.accent,
  },
})
