# Development

Day-to-day work on the app. Setting the machine up and releasing to TestFlight are in [../README.md](../README.md);
how the code is arranged is in [ARCHITECTURE.md](ARCHITECTURE.md).

## The loop

```bash
npm start          # Metro; scan the QR with the iPhone camera, Expo Go opens the app
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint + Prettier + import order; add -- --fix to fix what it can
npm test           # Jest; repository tests run on real SQLite through node:sqlite (Node 22.13+)
```

Before finishing a piece of work, run all three, and `npx expo export --platform ios` when anything about bundling,
assets or native modules changed — it catches what the dev bundle forgives. Delete the `dist/` it leaves behind.

Fast Refresh applies most edits to the device without a reload. A change to `app.json`, to a native module or to the
migrations list needs the app reopened from the QR code.

## Seeing what the device does

There is no simulator and no debugger attached, so the device speaks through Metro. Run Metro with its output kept:

```bash
npm start 2>&1 | tee /tmp/metro.log
```

Everything the app prints with `console.log` lands there, including the detector's own lines in a development build:

```
[detector] measured the room: baseline -47.3 dB, peak -41.0 dB
[detector] heard the child: baseline -47.3 dB, threshold -35.3 dB, peak -22.8 dB
[detector] nothing in the pause: baseline -47.3 dB, room -44.9 dB, peak -31.6 dB
```

For a runtime error, the red screen on the device carries the useful part; the log carries the stack. To look at the
database on the device, press `Shift+M` in the Metro terminal and choose **Open expo-sqlite**.

## Adding things

**A migration.** A new numbered file in `src/db/migrations/`, exported from `index.ts`, appended to the array. Never
edit an applied one. Then the row type in `schema.ts`, the repository that reads and writes the column, the fixtures in
its test, and the schema block in SPEC §6. Migration 5 (`sequence-item-audio-levels`) is a small complete example.

**A setting.** The options list, the type, the field, the default and the read in `settings.repository.ts`; the export
in `src/db/index.ts`; a row in `app/(parent)/settings.tsx`; the label and the hint in `src/i18n/uz.ts`; the line in
SPEC §5. Settings are a key/value table, so a new one needs no migration.

**An event type.** The union in `schema.ts`, the place that logs it, the list in SPEC §6 with a sentence on what it
means. Anything the child can do writes one.

**A string.** `src/i18n/uz.ts`, always. No literal the user can read belongs in a component. Card and sequence text the
parent typed is never transliterated or corrected.

**A screen.** A file under `app/(child)/` or `app/(parent)/` that renders a feature component; the logic goes in
`src/features/<area>/`, the pure parts in their own module with a test.

## Tests

Pure logic is tested, UI is not (v0.1). That means the detector, the round machine, the debounce, the session clock,
the board layout, the drafts, the log queries and every repository. `migratedDatabase()` gives a test a real migrated
SQLite database in memory; look at any `*.repository.test.ts` for the shape.

## Branches and commits

One step of work per branch, `feat/<step>` or `fix/<thing>`, merged into `main` with `--no-ff` so the step stays
visible in the history. Conventional commits in English, subject in the imperative, body explaining why rather than
what. The device check comes before the merge: anything to do with audio, timing or layout cannot be judged from the
code.

Do not change the database schema without deciding to — see the rule in CLAUDE.md. The same goes for the design
principles: if a feature seems to need a demand, a failure state, an endless mode or a stock voice, the feature is
wrong, not the principle.

## Before pushing the repo anywhere

The repository describes a real child in some detail (CLAUDE.md, SPEC §1) and the app holds recordings of his voice on
the device. The code has no secrets — no keys, no backend — and media is not committed, but **the repository belongs in
a private GitHub repo**, not a public one.
