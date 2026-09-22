import { Redirect } from 'expo-router'
import type { ReactElement } from 'react'

/** The app always opens in child mode. */
export default function Index(): ReactElement {
  return <Redirect href="/requests" />
}
