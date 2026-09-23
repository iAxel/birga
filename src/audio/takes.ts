import { Directory, File, Paths } from 'expo-file-system'

/** Where expo-audio writes what it records, until the app moves it or throws it away. */
const TAKES_DIRECTORY = 'ExpoAudio'

/**
 * Throws away every take left in the cache. The child's takes are deleted as they are used: the detector's the moment
 * the microphone closes, an attempt's as soon as it is copied into the app's media, one too short to keep at once. A
 * take of the parent's voice stays here after it is copied into a card, and whatever an app that died mid-recording
 * left behind stays too, until this runs: at start-up, when nothing is recording, and when the diary is cleared, so no
 * audio of the child sits on the device unasked (CLAUDE.md).
 */
export function discardStrayTakes(): void {
  try {
    const directory = new Directory(Paths.cache, TAKES_DIRECTORY)

    if (!directory.exists) {
      return
    }

    for (const entry of directory.list()) {
      entry.delete()
    }
  } catch {
    return
  }
}

/** Deletes one take the recorder wrote; a take that is already gone, or cannot be reached, is left as it is. */
export function deleteTake(uri: string): void {
  try {
    const take = new File(uri)

    if (take.exists) {
      take.delete()
    }
  } catch {
    return
  }
}
