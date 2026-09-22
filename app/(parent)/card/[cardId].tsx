import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'
import { CardEditor } from '@/features/cards/card-editor'
import { parseIdParam } from '@/ui/route-params'

/** An existing card: change its photo, word, voice or board, or archive it. */
export default function EditCardScreen(): ReactElement {
  const params = useLocalSearchParams<{ cardId: string }>()

  return <CardEditor boardId={null} cardId={parseIdParam(params.cardId)} />
}
