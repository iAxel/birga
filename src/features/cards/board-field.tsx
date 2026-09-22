import type { ReactElement } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Board } from '@/db'
import { strings } from '@/i18n'
import { Panel, SectionLabel } from '@/ui/panel'
import { color, radius, space, touch, typography } from '@/ui/theme'

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
    <Panel>
      <SectionLabel title={strings.cardEditor.board} />
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
              <Text style={[typography.button, isSelected && styles.optionSelectedText]}>{board.title}</Text>
            </Pressable>
          )
        })}
      </View>
    </Panel>
  )
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  option: {
    minHeight: touch.parent,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderWidth: 1.5,
    borderColor: color.hint,
    borderRadius: radius.buttonSm,
  },
  optionSelected: {
    borderColor: color.accentBg,
    backgroundColor: color.accentBg,
  },
  optionSelectedText: {
    color: color.accent,
  },
})
