## 1. Foundation and migration

- [x] 1.1 Add shared versioned types for queue, playback preferences, favorites, playlists, scenes, room preferences, and ambient mix.
- [x] 1.2 Upgrade the existing IndexedDB without rewriting or deleting `songs`, add stores for the new local records, and expose focused read/write adapters with visible failure results.
- [x] 1.3 Add migration and adapter tests covering a v1 database with audio Blob data, successful round trips, missing IDs, and rejected writes.

## 2. Unified playback queue

- [x] 2.1 Implement and test pure queue transitions for play-now, play-next, append, remove, reorder, previous, next, and bounded failure skipping.
- [x] 2.2 Implement and test sequence, persistent shuffle, list-repeat, and single-repeat behavior including queue-end rules.
- [x] 2.3 Replace the temporary Later/current-track split with the unified queue controller while preserving the existing recommendation and demo-track entry points.
- [x] 2.4 Connect the audio `ended`, error, manual previous/next, and direct-play paths to the queue and show the actual upcoming order in an accessible queue panel.

## 3. Library organization

- [x] 3.1 Add derived title/artist search, tag/room/favorite filters, recent-added sorting, empty results, and a clear-filters action to the music library.
- [x] 3.2 Add persistent favorite toggles that never duplicate or remove the underlying audio.
- [x] 3.3 Add playlist create, rename, delete, add/remove track, reorder, and play controls using stable track IDs.
- [x] 3.4 Verify playlist and library deletion boundaries, missing-track handling, keyboard focus, and search input shortcut isolation.

## 4. Session recovery

- [x] 4.1 Persist queue, shuffle order, playback mode, current track ID, throttled progress, volume, favorites, playlists, and approved UI preferences.
- [x] 4.2 Restore state only after the music library resolves, filter missing relationships, seek to a valid saved position, and remain paused.
- [x] 4.3 Add user-facing storage and audio failure states without false success messages, playback interruption, infinite retries, or persistence of private memory.
- [x] 4.4 Run and record stage A automated and browser acceptance checks A-01 through A-09.

## 5. Controlled room preferences and scenes

- [x] 5.1 Lift room, daylight, weather, resident visibility, and resident activity preferences into a controlled page-level model without restarting the current song.
- [x] 5.2 Add scene create, rename, update, delete, and restore UI backed by versioned local scene data.
- [x] 5.3 Add optional playlist association with a separate explicit play action and graceful handling for deleted playlists.
- [x] 5.4 Verify scene records exclude private memory, original paths, audio Blob data, camera position, resident coordinates, and in-progress poses.

## 6. Ambient audio

- [x] 6.1 Select or create a minimal set of low-presence loop assets for the three rooms and record source, license, attribution, loop, and relative-volume checks.
- [x] 6.2 Implement one active looping ambient track with opt-in enablement, independent volume, music-only pause, all-audio pause, and isolated error status.
- [x] 6.3 Add fade transitions and scene persistence without automatic sound from visual weather or accidental multi-track overlap.

## 7. Resident and room polish

- [x] 7.1 Produce a real-page preview of the stage B room, scene, ambient, and resident changes while preserving the confirmed face and clothing identity.
- [x] 7.2 Refine resident state transitions so new commands, seated waving, rising, route changes, low-frequency context behavior, auto mode, hiding, and reduced motion follow the specs.
- [x] 7.3 Refine rooftop skyline depth and daylight consistency, then align cabin and cloud materials, lighting, weather indicators, and resident framing without increasing rendering load materially.
- [x] 7.4 Verify keyboard controls, focus/pressed states, drag-versus-click behavior, close-up cropping, reduced motion, background drawing throttle, and WebGL fallback.

## 8. Verification and documentation

- [x] 8.1 Add focused tests for every new non-trivial state transition and persistence boundary, then run the full Node test suite, ESLint, TypeScript/Next.js production build.
- [x] 8.2 Run and record stage B browser acceptance checks B-01 through B-08 on all three rooms, including audio and performance context.
- [x] 8.3 Update `ARCHITECTURE.md`, `DATA_MODEL.md`, `TESTING.md`, `README.md`, and `docs/ITERATION_PLAN.md` with actual implemented behavior, migration, asset licenses, checks, screenshots, and remaining stage C candidates.
- [x] 8.4 Review the final diff for accidental backend, cloud, online-source, private-memory persistence, unknown assets, generated test output, or unrelated workspace changes.
