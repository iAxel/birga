import type { ReactElement } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Board } from '@/db'
import { strings } from '@/i18n'
import { colors, radii, spacing, touch, typography } from '@/ui/theme'

interface BoardFieldProps {
  boards: Board[]
  boardId: number
  onChange: (boardId: number) => void
}

/** The board the card belongs to; not shown while there is only one board. */
export function BoardField({ boards, boardId, onChange }: BoardFieldProps): ReactElement | null {
  if (boards.length < 2) {
    return null
  }

  return (
    <View style={styles.field}>
      <Text style={typography.caption}>{strings.cardEditor.board}</Text>
      <View style={styles.options}>
        {boards.map((board) => {
          const isSelected = board.id === boardId

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                selected: isSelected,
              }}
              key={board.id}
              onPress={() => onChange(board.id)}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Text style={[typography.body, isSelected && styles.optionSelectedText]}>{board.title}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    minHeight: touch.parent,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    backgroundColor: colors.accentSoft,
  },
  optionSelectedText: {
    color: colors.accent,
    fontWeight: '600',
  },
})
