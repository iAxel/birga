import { Button, FieldGroup, Host, Picker, Row, Spacer, Text } from '@expo/ui'
import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { StyleSheet } from 'react-native'
import { CARDS_PER_SCREEN_OPTIONS, DEBOUNCE_SECONDS_OPTIONS, MIN_BREAK_MINUTES_OPTIONS, SESSION_MINUTES_OPTIONS } from '@/db'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { colors, spacing } from '@/ui/theme'

/**
 * Parent settings (SPEC §5): how many cards the child sees, how long a card stays silent after the child played it, how
 * long a session lasts, the break before the next one, and the parent's "Xayr!" for its end.
 */
export default function SettingsScreen(): ReactElement {
  const router = useRouter()
  const settings = useSettings()
  const saveSetting = useSaveSetting()

  return (
    <Host colorScheme="light" style={styles.host}>
      <FieldGroup>
        <FieldGroup.Section title={strings.settings.requestsSection}>
          <Row alignment="center" spacing={spacing.md}>
            <Text>{strings.settings.cardsPerScreen}</Text>
            <Spacer flexible />
            <Picker onValueChange={(value) => saveSetting('cardsPerScreen', value)} selectedValue={settings.cardsPerScreen}>
              {CARDS_PER_SCREEN_OPTIONS.map((option) => (
                <Picker.Item key={option} label={String(option)} value={option} />
              ))}
            </Picker>
          </Row>
          <Row alignment="center" spacing={spacing.md}>
            <Text>{strings.settings.debounce}</Text>
            <Spacer flexible />
            <Picker onValueChange={(value) => saveSetting('debounceSeconds', value)} selectedValue={settings.debounceSeconds}>
              {DEBOUNCE_SECONDS_OPTIONS.map((option) => (
                <Picker.Item key={option} label={strings.settings.seconds(option)} value={option} />
              ))}
            </Picker>
          </Row>
          <FieldGroup.SectionFooter>
            <Text
              textStyle={{
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              {strings.settings.debounceHint}
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section title={strings.settings.sessionSection}>
          <Row alignment="center" spacing={spacing.md}>
            <Text>{strings.settings.sessionLength}</Text>
            <Spacer flexible />
            <Picker onValueChange={(value) => saveSetting('sessionMinutes', value)} selectedValue={settings.sessionMinutes}>
              {SESSION_MINUTES_OPTIONS.map((option) => (
                <Picker.Item key={option} label={strings.settings.minutes(option)} value={option} />
              ))}
            </Picker>
          </Row>
          <Row alignment="center" spacing={spacing.md}>
            <Text>{strings.settings.minBreak}</Text>
            <Spacer flexible />
            <Picker onValueChange={(value) => saveSetting('minBreakMinutes', value)} selectedValue={settings.minBreakMinutes}>
              {MIN_BREAK_MINUTES_OPTIONS.map((option) => (
                <Picker.Item
                  key={option}
                  label={option === 0 ? strings.settings.noBreak : strings.settings.minutes(option)}
                  value={option}
                />
              ))}
            </Picker>
          </Row>
          <Button label={strings.settings.goodbyeVoice} onPress={() => router.push('/goodbye-voice')} />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
})
