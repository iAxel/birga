import { describe, expect, test } from '@jest/globals'
import { TakeRecorder } from '@/audio/take-recorder'
import { NativeRecorder } from '@/audio/testing/native-recorder'

function takesOn(recorder: NativeRecorder): TakeRecorder {
  return new TakeRecorder(recorder, {}, (uri) => recorder.files.delete(uri))
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('TakeRecorder', () => {
  test('records a take and hands its file over', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    expect(await takes.start()).toBe(true)
    expect(recorder.state).toBe('recording')

    const uri = await takes.stop()

    expect(uri).toBe(recorder.uri)
    expect(recorder.state).toBe('stopped')
    expect(recorder.files.has(uri ?? '')).toBe(true)
  })

  test('never leaves the recorder prepared when the take is given up while it is prepared', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    recorder.holdsPrepare = true

    const started = takes.start()

    await settle()

    const stopped = takes.stop()

    recorder.releasePrepare()

    expect(await started).toBe(false)
    expect(await stopped).toBeNull()
    expect(recorder.state).toBe('stopped')
    expect(recorder.files.size).toBe(0)

    recorder.resumeByItself()

    expect(recorder.state).toBe('stopped')
  })

  test('records only the latest of the takes asked for during one prepare', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    recorder.holdsPrepare = true

    const first = takes.start()

    await settle()

    const stopped = takes.stop()
    const second = takes.start()

    recorder.releasePrepare()

    await settle()

    recorder.releasePrepare()

    expect(await first).toBe(false)
    expect(await stopped).toBeNull()
    expect(await second).toBe(true)
    expect(recorder.state).toBe('recording')
    expect([...recorder.files]).toEqual([recorder.uri])
  })

  test('does not prepare at all for a take given up before its turn came', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)
    const started = takes.start()

    takes.stop()

    expect(await started).toBe(false)
    expect(recorder.prepares).toBe(0)
  })

  test('deletes the file of a discarded take', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    await takes.start()
    await takes.discard()

    expect(recorder.state).toBe('stopped')
    expect(recorder.files.size).toBe(0)
  })

  test('stops a recorder expo-audio restarted by itself, and deletes what it wrote', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    recorder.state = 'prepared'
    recorder.uri = 'file:///Caches/ExpoAudio/recording-reset.m4a'
    recorder.files.add(recorder.uri)

    recorder.resumeByItself()

    await takes.audit()

    expect(recorder.state).toBe('stopped')
    expect(recorder.files.size).toBe(0)
  })

  test('stops a recorder the system left prepared before anything resumes it', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    recorder.state = 'prepared'
    recorder.uri = 'file:///Caches/ExpoAudio/recording-reset.m4a'
    recorder.files.add(recorder.uri)

    await takes.audit()

    recorder.resumeByItself()

    expect(recorder.state).toBe('stopped')
    expect(recorder.files.size).toBe(0)
  })

  test('leaves a take that is running alone', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    await takes.start()
    await takes.audit()

    expect(recorder.state).toBe('recording')
    expect(await takes.stop()).toBe(recorder.uri)
  })

  test('deletes a take in progress when the screen goes, without reaching the released recorder', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    await takes.start()

    recorder.isReleased = true

    takes.detach()

    expect(recorder.files.size).toBe(0)
    expect(await takes.stop()).toBeNull()
    expect(await takes.start()).toBe(false)
  })

  test('takes again once the screen is attached again, as after a Fast Refresh', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    takes.detach()
    takes.attach()

    expect(await takes.start()).toBe(true)
  })

  test('gives no take when the recorder cannot be prepared, and holds nothing up', async () => {
    const recorder = new NativeRecorder()
    const takes = takesOn(recorder)

    recorder.failsPrepare = true

    expect(await takes.start()).toBe(false)
    expect(await takes.stop()).toBeNull()

    recorder.failsPrepare = false

    expect(await takes.start()).toBe(true)
  })
})
