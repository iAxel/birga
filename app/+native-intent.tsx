import type { NativeIntent } from 'expo-router'

/**
 * Links from outside the app (SPEC §1). The only way into parent mode is the three-second hold on the gate, so no link
 * opens a screen of its own: an app launched by one starts where it always starts, and a link that arrives while the
 * app runs changes nothing, least of all the child's screen or a paused session.
 */
export const redirectSystemPath: NativeIntent['redirectSystemPath'] = ({ initial }) => {
  if (initial) {
    return '/'
  }

  return null
}
