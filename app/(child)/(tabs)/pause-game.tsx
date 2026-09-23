import type { ReactElement } from 'react'
import { PauseGameView } from '@/features/pauseGame/pause-game-view'

/** The turn-taking game: the app says a known sequence and stops before one item (SPEC §3). */
export default function PauseGameScreen(): ReactElement {
  return <PauseGameView />
}
