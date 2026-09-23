import { Directory, Paths } from 'expo-file-system'

/** Where expo-audio writes what it records, until the app moves it or throws it away. */
const TAKES_DIRECTORY = 'ExpoAudio'

/**
 * Throws away every take left in the cache. Nothing keeps one on purpose: a recording of a card is copied into the
 * app's own media directory as it is saved, and the detector deletes its take the moment the microphone closes. What
 * is still here was left by an app that died mid-recording, and no audio of the child may sit on the device unasked
 * (CLAUDE.md). Called at start-up, when nothing is recording.
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
