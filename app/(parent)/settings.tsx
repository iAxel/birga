import { Button, FieldGroup, Host, Picker, Row, Spacer, Text, TextInput, useNativeState } from '@expo/ui'
import { useRouter } from 'expo-router'
import type { ReactElement } from 'react'
import { StyleSheet } from 'react-native'
import { CARDS_PER_SCREEN_OPTIONS, DEBOUNCE_SECONDS_OPTIONS, MIN_BREAK_MINUTES_OPTIONS, SESSION_MINUTES_OPTIONS } from '@/db'
import { useSaveSetting, useSettings } from '@/features/settings/settings-provider'
import { strings } from '@/i18n'
import { useFormFactor } from '@/ui/form-factor'
import { color, space } from '@/ui/theme'

const FOOTER_STYLE = {
  fontSize: 13,
  color: color.muted,
}

/**
 * Parent settings (SPEC §5): the child's name for the start screen, how many cards the child sees, how long a card
 * stays silent after the child played it, how long a session lasts, the break before the next one, and the parent's
 * "Xayr!" for its end. The name is stored as typed.
 */
export default function SettingsScreen(): ReactElement {
  const router = useRouter()
  const settings = useSettings()
  const saveSetting = useSaveSetting()
  const isPhone = useFormFactor() === 'phone'
  const childName = useNativeState(settings.childName)

  return (
    <Host colorScheme="light" style={styles.host}>
      <FieldGroup>
        <FieldGroup.Section title={strings.settings.childSection}>
          <Row alignment="center" spacing={space.md}>
            <Text>{strings.settings.childName}</Text>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={(text) => saveSetting('childName', text)}
              placeholder={strings.settings.childNamePlaceholder}
              value={childName}
            />
          </Row>
          <FieldGroup.SectionFooter>
            <Text textStyle={FOOTER_STYLE}>{strings.settings.childNameHint}</Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section title={strings.settings.requestsSection}>
          <Row alignment="center" spacing={space.md}>
            <Text>{strings.settings.cardsPerScreen}</Text>
            <Spacer flexible />
            <Picker onValueChange={(value) => saveSetting('cardsPerScreen', value)} selectedValue={settings.cardsPerScreen}>
              {CARDS_PER_SCREEN_OPTIONS.map((option) => (
                <Picker.Item key={option} label={String(option)} value={option} />
              ))}
            </Picker>
          </Row>
          <Row alignment="center" spacing={space.md}>
            <Text>{strings.settings.debounce}</Text>
            <Spacer flexible />
            <Picker onValueChange={(value) => saveSetting('debounceSeconds', value)} selectedValue={settings.debounceSeconds}>
              {DEBOUNCE_SECONDS_OPTIONS.map((option) => (
                <Picker.Item key={option} label={strings.settings.seconds(option)} value={option} />
              ))}
            </Picker>
          </Row>
          <FieldGroup.SectionFooter>
            <Text textStyle={FOOTER_STYLE}>
              {isPhone
                ? `${strings.settings.cardsPerScreenPhoneHint} ${strings.settings.debounceHint}`
                : strings.settings.debounceHint}
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section title={strings.settings.sessionSection}>
          <Row alignment="center" spacing={space.md}>
            <Text>{strings.settings.sessionLength}</Text>
            <Spacer flexible />
            <Picker onValueChange={(value) => saveSetting('sessionMinutes', value)} selectedValue={settings.sessionMinutes}>
              {SESSION_MINUTES_OPTIONS.map((option) => (
                <Picker.Item key={option} label={strings.settings.minutes(option)} value={option} />
              ))}
            </Picker>
          </Row>
          <Row alignment="center" spacing={space.md}>
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
