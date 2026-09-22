import { Image } from 'expo-image'
import {
  type ImagePickerOptions,
  type ImagePickerResult,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
} from 'expo-image-picker'
import { SymbolView } from 'expo-symbols'
import type { ReactElement } from 'react'
import { Alert, Linking, StyleSheet, Text, View } from 'react-native'
import { type MediaDraft, mediaDraftUri } from '@/features/cards/card-draft'
import { strings } from '@/i18n'
import { ParentButton } from '@/ui/parent-button'
import { color, radius, space, typography } from '@/ui/theme'

const PICKER_OPTIONS: ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
}

const PHOTO_SIZE = 200

interface PhotoFieldProps {
  image: MediaDraft | null
  onChange: (image: MediaDraft | null) => void
}

/** Optional photo of the real thing, from the camera or the library, cropped square by the system picker. */
export function PhotoField({ image, onChange }: PhotoFieldProps): ReactElement {
  async function takePhoto(): Promise<void> {
    const permission = await requestCameraPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(strings.cardEditor.cameraDenied, undefined, [
        {
          text: strings.common.cancel,
          style: 'cancel',
        },
        {
          text: strings.common.openSettings,
          onPress: () => Linking.openSettings(),
        },
      ])

      return
    }

    applyResult(await launchCameraAsync(PICKER_OPTIONS))
  }

  async function pickPhoto(): Promise<void> {
    applyResult(await launchImageLibraryAsync(PICKER_OPTIONS))
  }

  function applyResult(result: ImagePickerResult): void {
    const asset = result.assets?.[0]

    if (result.canceled || !asset) {
      return
    }

    onChange({
      kind: 'captured',
      uri: asset.uri,
    })
  }

  return (
    <View style={styles.field}>
      <Text style={typography.body}>{strings.cardEditor.photo}</Text>
      {image ? (
        <Image contentFit="cover" source={{ uri: mediaDraftUri(image) }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <SymbolView name="photo" size={48} tintColor={color.hint} />
        </View>
      )}
      <ParentButton onPress={takePhoto} title={strings.cardEditor.takePhoto} />
      <ParentButton onPress={pickPhoto} title={strings.cardEditor.pickPhoto} />
      {image && <ParentButton onPress={() => onChange(null)} title={strings.cardEditor.removePhoto} />}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    alignSelf: 'center',
    borderRadius: radius.button,
  },
  noPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.card,
  },
})
