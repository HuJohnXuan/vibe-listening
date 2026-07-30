# Remaining Album Covers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, validate, save, and integrate pure-pattern covers for the six catalog tracks that still use the original cover assets.

**Architecture:** Generate one independent square PNG per song with the built-in image generator. Save non-destructive `-pattern-v2` variants, update only the six catalog URLs, then verify all ten tracks use valid pure-pattern assets and that browser song switching shows each new cover.

**Tech Stack:** Built-in image generation, PNG assets, TypeScript local catalog, Node.js tests, browser visual inspection.

## Global Constraints

- Use warm brown, burgundy, honey gold, and ember orange, with limited muted blue-gray where the title requires it.
- Use title-matched patterns only; no text, letters, logos, watermarks, people, vinyl records, turntables, tonearms, grooves, circular record labels, or concentric record compositions.
- Keep one clear motif readable in the turntable center and recommendation thumbnails.
- Save new files without overwriting the original cover files.
- Do not change playback, discovery, or page layout behavior.

---

### Task 1: Generate Six Pattern Covers

**Files:**
- Create: `public/assets/covers/hallway_echo-pattern-v2.png`
- Create: `public/assets/covers/velvet_receiver-pattern-v2.png`
- Create: `public/assets/covers/blue_hour_vinyl-pattern-v2.png`
- Create: `public/assets/covers/quiet_side_of_rain-pattern-v2.png`
- Create: `public/assets/covers/velvet_weather-pattern-v2.png`
- Create: `public/assets/covers/candle_smoke-pattern-v2.png`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-26-remaining-album-covers-design.md`
- Produces: six square PNG cover assets

- [ ] **Step 1: Generate `Hallway Echo`**

  Use repeating champagne-gold doorway frames receding through a dark burgundy field, with fading angular echo lines and tactile vintage paper grain.

- [ ] **Step 2: Generate `Velvet Receiver`**

  Use deep wine-red velvet folds crossed by fine antique-gold signal waves and muted geometric reception marks, without depicting a telephone.

- [ ] **Step 3: Generate `Blue Hour Vinyl`**

  Use layered dusk-blue and burgundy atmospheric bands with warm gold horizon ripples, explicitly avoiding all circular and record-like imagery.

- [ ] **Step 4: Generate `Quiet Side of Rain`**

  Use diagonal rain lines concentrated on one side, calm negative space on the other, and a small warm amber glow.

- [ ] **Step 5: Generate `Velvet Weather`**

  Use flowing velvet-like cloud layers and fine champagne-gold air currents over warm brown and burgundy.

- [ ] **Step 6: Generate `Candle Smoke`**

  Use luminous ember-orange smoke ribbons tracing calligraphic but non-letter shapes through a dark brown field, without depicting a candle.

- [ ] **Step 7: Validate and save all outputs**

  Confirm square dimensions, distinct title-matched motifs, strong thumbnail contrast, series consistency, and absence of forbidden record imagery. Copy approved outputs to the exact paths above.

### Task 2: Integrate and Verify the Covers

**Files:**
- Modify: `src/adapters/local_data/track-catalog.ts`
- Modify: `tests/track_catalog.test.mjs`
- Modify: `README.md`
- Modify: `docs/TESTING.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the six PNG files created in Task 1
- Produces: catalog URLs that make all ten songs use pure-pattern covers

- [ ] **Step 1: Add a failing catalog mapping test**

  Extend the approved-cover map in `tests/track_catalog.test.mjs` with the six exact `-pattern-v2.png` URLs and run:

  ```powershell
  node --test .\tests\track_catalog.test.mjs
  ```

  Expected: FAIL because the six catalog entries still reference their original PNG files.

- [ ] **Step 2: Update the six catalog URLs**

  Replace only the `coverUrl` values for `hallway_echo`, `velvet_receiver`, `blue_hour_vinyl`, `quiet_side_of_rain`, `velvet_weather`, and `candle_smoke`.

- [ ] **Step 3: Synchronize documentation**

  Record that all ten songs now use title-matched pure-pattern covers and that the catalog mapping is tested.

- [ ] **Step 4: Run automated verification**

  ```powershell
  npm test
  npm run lint
  ```

  Expected: all tests pass and lint exits with code 0.

- [ ] **Step 5: Run browser verification**

  Open `http://localhost:3000/`, switch through the six newly covered songs with the next button, confirm each turntable center image changes to the expected asset, then leave the page reset for user review.
