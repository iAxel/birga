# Architecture

How the app is put together, and which parts will bite you if you forget why they are shaped this way.
What the app is for and what it must do is in [SPEC.md](SPEC.md); how it looks is in [DESIGN.md](DESIGN.md);
the working rules are in [../CLAUDE.md](../CLAUDE.md).

## Shape

One Expo app, two modes over one local SQLite database. Nothing leaves the device except an export the parent starts.

```
app/_layout.tsx          fonts, then DatabaseProvider → SettingsProvider → SessionProvider → the root stack
app/index.tsx            decides where a launch lands: onboarding, the board, or the calm start screen
app/(child)/             what the child sees: the request board, the pause game, the goodbye screen
app/(parent)/            what the parent sees: home, cards, sequences, the diary, settings, onboarding
src/db/                  schema, migrations, repositories, media files
src/audio/               player, recorder, vocalization detector, microphone permission
src/features/            the logic of each part, screen-shaped
src/ui/                  theme tokens and the shared pieces both modes are built from
src/i18n/uz.ts           every string the user sees
```

Screens are thin. A screen reads a hook, renders `src/ui` pieces and calls a function from `src/features`.
Anything worth testing lives in a pure module next to the component that uses it: `pause-round.ts`, `request-gate.ts`,
`session-clock.ts`, `board-layout.ts`, `vocalization.ts`, `log-week.ts`, the drafts.

## Data

`src/db/migrations/` holds numbered, append-only migrations; `migrate.ts` applies the pending ones, each in its own
transaction with the `user_version` bump. An applied migration is never edited — a fix is a new version. The schema is
listed in SPEC §6.

Repositories (`src/db/repositories/`) are the only place that writes SQL. They take a `Database`, which is the small
interface in `src/db/database.ts` — `expo-sqlite` satisfies it on the device, and `node:sqlite` satisfies it in the
tests (`src/db/testing/`), which is why repository tests run against real SQLite without a simulator.

`useRepositories()` builds them once per connection and wraps the connection in `serializeTransactions()`: expo-sqlite
runs `BEGIN` on a shared connection and has no queue of its own, so two transactions started at the same time break
each other. Every transaction in the app waits its turn there.

Media (photos, recordings) lives in the document directory under `media/<folder>/`; the database stores relative paths
only, because the absolute one changes between installs. `src/db/media.ts` is the only module that touches files.

Screens read through `useFocusQuery()`: a query that runs whenever the screen comes into view, so a screen shows what
the parent changed elsewhere, and a failed read leaves the last value in place instead of throwing into an empty UI.

## State

No store. Three providers, in this order, each holding its children back until it is ready:

- `DatabaseProvider` — opens the database and migrates it. It is `SQLiteProvider` underneath, which is memoised on its
  own props and **drops a children element that changes after it mounted**, so nothing below it may depend on a value
  computed above it. That is why fonts are awaited in `RootLayout` before the providers, not inside them.
- `SettingsProvider` — loads the settings row set once and saves through, so a change is visible everywhere at once.
- `SessionProvider` — the running session, its clock, the minimum break, and closing a session the app died in.

Everything else is component state plus the focus queries above.

## Audio

Three different things use the microphone and the speaker, and they must not step on each other.

- **Playing** goes through `useVoicePlayer()` (`src/audio/use-voice-player.ts`). A plain `useAudioPlayer` deactivates
  the audio session when playback ends or pauses, and iOS then stops whatever is recording at that moment. The hook
  keeps the session active. `stopVoice()` silences a player that may already have been released.
- **Recording the parent** is `useVoiceRecorder()`: hold to record, 4 s at most, metering sampled ten times a second so
  the editor can draw the shape of the take.
- **Listening for the child** is `useVocalizationListener()`, a `VocalizationListener` over the pure detector in
  `vocalization.ts`. It opens 150 ms after the app falls silent, judges each reading against the room, and closes before
  the app speaks again. The room is measured only in the app's quiet moments — before a game, between two rounds, the
  tail of a pause nobody filled — and kept in the settings for the next session. expo-audio writes a file whether we
  want one or not, so the take is deleted the moment the microphone closes, and `discardStrayTakes()` at start-up
  removes anything an app that died mid-pause left behind.

Both go through `TakeRecorder` (`take-recorder.ts`, pure and tested against a model of expo-audio's native recorder).
expo-audio starts **every prepared or paused recorder by itself** when the app returns to the foreground or an audio
interruption ends, and its `stop()` does nothing to a recorder that is prepared but not recording. A take given up while
it was being prepared — a quick tap on a hold-to-record button — would leave the recorder ready, and the next unlock of
the device would record the child with nobody asking. `TakeRecorder` runs prepare, record and stop strictly one after
another, records and stops such a take at once and deletes its file, knows every take's file by its path, and checks
the recorder again whenever the app becomes active.

The audio session itself is configured once at start-up (`audio-session.ts`): recording allowed, sound in silent mode.
While a session runs in child mode the screen is kept on (`KeepScreenAwake`); Expo does that by itself only in a
development build.

## The pause game

`pause-round.ts` is the state machine, pure and tested: where the pause falls this round, what a said item does, what a
pause ending does, when a game is over. `pause-game-view.tsx` is the runtime around it — it plays items, opens the
microphone, draws the words and the reward, and writes the events. A round is:

```
saying → (the item before the pause is said) → waiting → the child, the parent's button, or the timer
       → saying (the item itself, then the rest of the sequence) → finished → next round or the play button
```

Three details that look like bugs but are not: a round interrupted by leaving the tab still counts, or five rounds
could be stretched forever; the app waits a second after the item the pause was about, since that is when the child is
most likely to echo it; and a playback that never reports its end is cut short by a watchdog rather than hanging.

## The event log

Every child-facing interaction writes one row through `useEventLog()`, which attaches the running session and never
makes the UI wait for the write. The types are listed in SPEC §6 and in `schema.ts`; adding an interaction means adding
its type. The diary and the export read the log through the events repository, never with SQL of their own.

## Things that will bite you

- **React Compiler is on.** No `setState` in an effect body, no ref reads or writes during render, `useEffectEvent`
  only from effects. The lint rules catch it; the errors read as unrelated until you know that.
- **`onLongPress` is a JS timer.** A busy JS thread delays it, which once made the parent gate stop opening. The gate
  is driven by the completion callback of its ring animation on the UI thread instead.
- **Reanimated values** are read and written with `.get()`/`.set()` only in worklets, handlers and effects.
- **Expo APIs move between SDKs.** Check `docs.expo.dev` (append `.md` to a page for markdown) before using a module;
  `expo-av` is gone, `expo-file-system` has the `File`/`Paths` API, `expo-audio` has its own rules above.
- **Expo Go only.** No custom native modules, no simulator, no Xcode. If something seems to need one, it waits.
