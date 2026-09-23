# CLAUDE.md

Working name: **Birga** ("together" in Uzbek). Placeholder, may change.

## What this is

An iOS app that helps a young child with delayed expressive speech start using words to communicate. It is a tool for **parent + child co-play**, not a self-serve kids' app. First user: one 4-year-old, Uzbek-speaking family. Distribution: TestFlight only for now.

Full requirements: `docs/SPEC.md`. Read it before implementing any feature.

## Child profile the design is built around

- Understands Uzbek, does not use speech to communicate. Articulation is fine: recites letters and numbers in three languages.
- Strong interest in letters, numbers, written text. Tends to fall into repetitive loops.
- Communicates wants by leading an adult's hand. So requests exist; the channel is missing.
- Bottleneck is communicative intent and turn-taking, NOT pronunciation or vocabulary.

## Design principles (non-negotiable)

These override "good UX" instincts from typical kids' apps. If a feature conflicts with one of them, stop and ask.

1. **Every interaction ends in the real world.** Tapping "suv" matters because a parent then hands over water. Never build a flow that is rewarding without an adult.
2. **No demands, no failure states.** Never "try again", "wrong", red crosses, sad sounds. If the child does nothing, the app models the answer itself and moves on.
3. **No infinite loops.** No endless modes, no autoplay chains, no replay-by-tapping-spam. Debounce repeated taps on the same card (see SPEC). Every session has a hard end.
4. **Parent's recorded voice only.** No TTS, no stock voices.
5. **Real photos over illustrations** for request cards: the child's actual cup, actual swing.
6. **Written word always visible** on cards. Text is a strength to lean on, not decoration.
7. **Calm visuals.** No flashing, no background music. One reward animation ≤ 1.5 s; at most 8 sparks rising once; glow and sparks are settings.
8. **No speech recognition.** We detect that the child vocalized, not what was said. A parent button can also credit an attempt.
9. **Offline, local, private.** No backend, no analytics SDKs, no accounts. Photos, voice and logs of a child never leave the device unless the parent explicitly exports.

## Stack

- Expo (latest stable SDK, managed workflow), TypeScript strict, Expo Router.
- **Dev machine is Windows + WSL2, no Mac.** Develop against **Expo Go** on a physical iPhone/iPad over LAN (`npx expo start` from WSL2 with mirrored networking, setup in README; `--tunnel` only as a fallback). Use only modules that ship in Expo Go; if a task seems to need a custom native module, stop and ask. Standalone builds come later via **EAS Build** (cloud) + TestFlight; never assume Xcode or an iOS simulator is available.
- Audio: `expo-audio` (`useAudioPlayer`, `useAudioRecorder`, metering via recorder state). **Do not use `expo-av`**: it was removed in SDK 55.
- Storage: `expo-sqlite` for cards, sessions, event log. Media files in the app document directory via `expo-file-system`; DB stores relative paths only.
- Camera / picker: `expo-image-picker`.
- Animation: `react-native-reanimated`. Character in v0.1 is a simple static image with 2–3 states. No Rive/Lottie until the core loop is proven with the child.
- State: plain React state + a thin repository layer over SQLite. No Redux/MobX/Zustand unless a real need appears.
- iOS only. Do not spend time on Android or web compatibility.

Expo APIs change between SDKs. Before using any Expo module, check the current docs (docs.expo.dev pages are available as markdown by appending `.md`) rather than relying on memory.

## Project layout

```
app/                  Expo Router screens
  (child)/            child-facing screens: requests, pause-game, goodbye
  (parent)/           parent mode: cards CRUD, settings, log export
src/
  db/                 schema, migrations, repositories
  audio/              player, recorder, vocalization detector
  features/           requests/, pauseGame/, session/
  ui/                 shared components, theme
docs/SPEC.md
```

## Conventions

- Code, identifiers, comments, commit messages: English. UI strings: Uzbek, kept in one `src/i18n/uz.ts` file. Parent mode may also have Russian later, so no hardcoded strings in components.
- Card text is whatever the parent typed (Latin or Cyrillic Uzbek). Never transliterate or "fix" it.
- Migrations are append-only, numbered files. Never edit an applied migration.
- Change the database schema (a table, a column, a migration) only when I ask for it. A feature that seems to need one: stop and ask.
- Every child-facing interaction writes an event to the log (see SPEC, Event log). If you add an interaction, add its event type.
- Touch targets in child mode: minimum 120×120 pt for anything the child taps. The parent's own controls on a child screen (the corner buttons, the gate dot) are deliberately small, 44–56 pt, so the child does not aim for them. Parent-mode entry is a 3-second hold on a small corner element, never a plain tap.
- Pure logic (vocalization detector, debounce, session timer) gets unit tests with Jest. UI does not need tests in v0.1.

## Audio rules (easy to get wrong)

- The mic listens **only during the pause window** and during the quiet measurements of the room (before a game starts and between two rounds), never while the app itself is playing sound, otherwise the app's own voice triggers detection.
- Audio session must allow recording and play in silent mode. Configure once at app start.
- Vocalization threshold is relative to an ambient noise baseline, not an absolute dB value. The baseline is measured only in the app's quiet moments (before a game, between rounds, the tail of a pause nobody filled), never below −70 dB, and kept in the settings between sessions. A pause triggers only on a rise from below the threshold.
- Never leave a recorder prepared. expo-audio starts every prepared or paused recorder by itself when the app returns to the foreground or an audio interruption ends, so every take goes through `TakeRecorder` (`src/audio`), which stops and deletes a take given up while it was being prepared.
- Never persist microphone audio automatically; the detector stores metering only. The only child audio kept is parent-initiated attempt recordings (hold on the attempt corner), stored locally, included in export, never played back to the child.
- Play audio through `useVoicePlayer` (`src/audio`). A plain `useAudioPlayer` deactivates the audio session on pause and at the end of playback, and iOS then stops any recording running at that moment.

## Out of scope for v0.1

Alphabet/letters teaching, animal vocab, lip-sync, animated characters, multi-child profiles, cloud sync, Android, App Store release, any AI/LLM features.

## Working with me

- I am a senior backend engineer (Node/NestJS), new to React Native. Explain RN/iOS-specific pitfalls briefly when they matter; skip general programming explanations.
- Small, reviewable steps. One feature per branch/commit series.
- If the spec is ambiguous, ask before building. If you think the spec is wrong, say so.
