/**
 * The shape of a recording as it is stored: the loudness sampled while the parent spoke, one value from 0 to 1 per
 * tenth of a second, kept as a JSON array so the editor can draw the take whenever the card or the item is opened.
 */
export function encodeLevels(levels: number[] | null): string | null {
  if (!levels || levels.length === 0) {
    return null
  }

  return JSON.stringify(levels.map((level) => Math.round(level * 100) / 100))
}

/** A malformed value is treated as no recording shape at all: the editor then draws the bars flat. */
export function decodeLevels(raw: string | null): number[] | null {
  if (raw === null) {
    return null
  }

  try {
    const levels: unknown = JSON.parse(raw)

    if (Array.isArray(levels) && levels.every((level) => typeof level === 'number')) {
      return levels
    }
  } catch {
    return null
  }

  return null
}
