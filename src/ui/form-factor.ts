import { useWindowDimensions } from 'react-native'

/** Child mode is laid out for two sizes: an iPad on the table and an iPhone in hand (DESIGN §3). */
export type FormFactor = 'phone' | 'tablet'

/** Shortest window side from which the tablet layout is used; also keeps an iPad in narrow split view on the phone one. */
const TABLET_MIN_SIDE = 600

export function formFactorOf(width: number, height: number): FormFactor {
  return Math.min(width, height) >= TABLET_MIN_SIDE ? 'tablet' : 'phone'
}

export function useFormFactor(): FormFactor {
  const { width, height } = useWindowDimensions()

  return formFactorOf(width, height)
}
