import { useLocalSearchParams } from 'expo-router'
import type { ReactElement } from 'react'
import { SequenceItemEditor } from '@/features/sequences/sequence-item-editor'
import { parseIdParam } from '@/ui/route-params'

/** An existing item: change its word, symbol, voice, photo or sequence, or remove it. */
export default function EditSequenceItemScreen(): ReactElement {
  const params = useLocalSearchParams<{ itemId: string }>()

  return <SequenceItemEditor itemId={parseIdParam(params.itemId)} sequenceId={null} />
}
