export const PRIMARY_BLANK_TOKEN = '____'
export const LEGACY_BLANK_TOKEN = '___'

export function getBlankPosition(sentence: string, fallback: number = 0): number {
  if (!sentence) {
    return fallback
  }

  const primaryIndex = sentence.indexOf(PRIMARY_BLANK_TOKEN)
  if (primaryIndex >= 0) {
    return primaryIndex
  }

  const legacyIndex = sentence.indexOf(LEGACY_BLANK_TOKEN)
  if (legacyIndex >= 0) {
    return legacyIndex
  }

  return fallback
}
