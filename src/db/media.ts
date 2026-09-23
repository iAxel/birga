import { Directory, File, Paths } from 'expo-file-system'

/** Media lives in the document directory; the database keeps paths relative to it, since the absolute one can change. */
const MEDIA_ROOT = 'media'

/** Card photos and voices; app phrases such as the parent's "Xayr!"; attempts the parent recorded of the child. */
export type MediaFolder = 'cards' | 'phrases' | 'attempts'

/** Copies a picked photo or a fresh recording out of its temporary location; returns the path to store. */
export async function storeMedia(sourceUri: string, folder: MediaFolder): Promise<string> {
  const directory = new Directory(Paths.document, MEDIA_ROOT, folder)

  directory.create({
    idempotent: true,
    intermediates: true,
  })

  const relativePath = `${MEDIA_ROOT}/${folder}/${uniqueFileName(sourceUri)}`

  await new File(sourceUri).copy(new File(Paths.document, relativePath))

  return relativePath
}

export function mediaUri(relativePath: string): string {
  return new File(Paths.document, relativePath).uri
}

/** Removes a stored file; one that is already gone is not an error. */
export function deleteMedia(relativePath: string): void {
  const file = new File(Paths.document, relativePath)

  if (file.exists) {
    file.delete()
  }
}

/** Every stored file gets a new name, so a replaced photo never shows up from an image cache. */
function uniqueFileName(sourceUri: string): string {
  const randomPart = Math.random().toString(36).slice(2, 10)

  return `${Date.now()}-${randomPart}${Paths.extname(sourceUri)}`
}
