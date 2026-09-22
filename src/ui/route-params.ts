/** Route params arrive as strings; anything but a positive integer means there is no such record to show. */
export function parseIdParam(value: string | string[] | undefined): number | null {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  return id
}
