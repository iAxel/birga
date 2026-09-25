import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { TakeRecorder } from '@/audio/take-recorder'
import { NativeRecorder } from '@/audio/testing/native-recorder'
import { DEFAULT_MARGIN_DB } from '@/audio/vocalization'
import { VocalizationListener } from '@/audio/vocalization-listener'

interface Setup {
  recorder: NativeRecorder
  listener: VocalizationListener
  rooms: number[]
}

function setUp(roomDb: number | null = null): Setup {
  const recorder = new NativeRecorder()
  const takes = new TakeRecorder(recorder, {}, (uri) => recorder.files.delete(uri))
  const listener = new VocalizationListener(takes, recorder)
  const rooms: number[] = []

  listener.setMargin(DEFAULT_MARGIN_DB)
  listener.setRoom(roomDb)
  listener.allow(true)
  listener.keepRoomWith((db) => rooms.push(db))

  return {
    recorder,
    listener,
    rooms,
  }
}

async function hear(recorder: NativeRecorder, db: number, durationMs: number): Promise<void> {
  recorder.metering = db

  await jest.advanceTimersByTimeAsync(durationMs)
}

describe('VocalizationListener', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('measures the room in a quiet moment, keeps it, and leaves no file behind', async () => {
    const { recorder, listener, rooms } = setUp()

    listener.measure(1000)

    await hear(recorder, -44, 1200)

    expect(rooms).toEqual([-44])
    expect(recorder.state).toBe('stopped')
    expect(recorder.files.size).toBe(0)
  })

  test('measures a loud room instead of taking it for the child', async () => {
    const { recorder, listener, rooms } = setUp()

    listener.measure(1000)

    await hear(recorder, -30, 1200)

    expect(rooms).toEqual([-30])
  })

  test('hears the child rise above the room once, and closes the microphone with it', async () => {
    const { recorder, listener } = setUp(-44)
    const heard: number[] = []

    listener.listen((at) => heard.push(at))

    await hear(recorder, -44, 200)
    await hear(recorder, -20, 600)

    expect(heard).toHaveLength(1)
    expect(recorder.state).toBe('stopped')
    expect(recorder.files.size).toBe(0)
  })

  test('lets a pause that ran out hand the room on, however stale the baseline was', async () => {
    const { recorder, listener, rooms } = setUp()
    const heard: number[] = []

    listener.listen((at) => heard.push(at))

    await hear(recorder, -36, 1000)

    listener.settle()
    listener.close()

    await jest.advanceTimersByTimeAsync(0)

    expect(heard).toEqual([])
    expect(rooms).toEqual([-36])
    expect(recorder.files.size).toBe(0)
  })

  test('opens nothing while the parent has not allowed the microphone', async () => {
    const { recorder, listener } = setUp()

    listener.allow(false)
    listener.measure(1000)

    await jest.advanceTimersByTimeAsync(1200)

    expect(recorder.prepares).toBe(0)
  })

  test('never listens in a window closed before the recorder started, and stops the recorder anyway', async () => {
    const { recorder, listener } = setUp(-44)
    const heard: number[] = []

    recorder.holdsPrepare = true

    listener.listen((at) => heard.push(at))

    await jest.advanceTimersByTimeAsync(0)

    listener.close()
    recorder.releasePrepare()

    await hear(recorder, -10, 1000)

    expect(heard).toEqual([])
    expect(recorder.state).toBe('stopped')
    expect(recorder.files.size).toBe(0)
  })
})
