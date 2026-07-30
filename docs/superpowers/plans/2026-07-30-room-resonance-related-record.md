# Room Resonance and Related Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the permanent Tonight’s Picks list with a restrained room-resonance system and one two-step related record while preserving playback, music radar, and later queue behavior.

**Architecture:** Keep the dependency direction `UI → services → core`. Pure core modules own resonance mapping, listening eligibility, session exclusions, candidate selection, and related-record state transitions; React only translates audio events into core inputs and renders returned states. The local-data adapter supplies manually curated resonance profiles and recommendation relations.

**Tech Stack:** TypeScript 5.9, React 19, Next.js 16 through Vinext, Node.js `node:test`, CSS, native Web Animations/CSS transitions, local static media.

## Global Constraints

- Node.js must remain `>=22.13.0`.
- Do not add a state-management, animation, validation, audio-analysis, or UI dependency.
- Do not use `any`; functions accept no more than three parameters unless they use an options object.
- New directories use `snake_case`; TypeScript component files use `kebab-case`.
- Core modules must not import React, browser audio APIs, CSS, or third-party libraries.
- Room changes occur once per track with a 3–6 second transition and never follow the beat.
- Furniture, layout, controls, and text colors remain stable across tracks.
- One seek is tolerated; the second seek disqualifies the current listening cycle.
- One playback cycle can reveal at most one frozen related record.
- First click flips the related record; second click switches and starts playback.
- No rejection control, implicit rejection inference, persistent profile, search, account, social feature, spectrum, particle, or scanning effect.
- UI controls, labels, status, errors, and accessibility text are Chinese; official song, artist, and album names stay unchanged.
- Each task follows red-green TDD, updates the documentation listed for that task, runs its focused verification, and then stops for user review before the next task.
- Git commit steps require a separately approved initial baseline because the repository currently has no commits and all project files are untracked.

---

## Planned File Structure

### New core and type files

- `src/types/room-resonance.ts`: resonance levels, dominant response, and rendered room state.
- `src/types/listening-session.ts`: listening-cycle state and three-entry session history.
- `src/types/related-record.ts`: related candidate and state-machine types.
- `src/core/room_resonance/map-room-resonance.ts`: pure profile-to-room-state mapping.
- `src/core/listening_engagement/listening-cycle.ts`: pure listening-time, seek, and reset transitions.
- `src/core/listening_engagement/session-history.ts`: bounded recent heard/skipped queue.
- `src/core/related_record/select-related-record.ts`: one frozen candidate with session exclusions.
- `src/core/related_record/related-record-state.ts`: `hidden/front/dimmed/back/consumed` transitions.
- `src/services/player/build-player-experience.ts`: compose radar, resonance, and one candidate.

### New UI files

- `src/ui/player/use-listening-cycle.ts`: translate audio callbacks to pure cycle actions.
- `src/ui/player/use-related-record.ts`: coordinate eligibility with the pure state machine.
- `src/ui/player/turntable-region.tsx`: current turntable and room-state attributes.
- `src/ui/player/current-track-panel.tsx`: current track and listening notes.
- `src/ui/player/related-record.tsx`: front, dimmed, and back interactions.
- `src/ui/player/discovery-panels.tsx`: Chinese music radar and later queue.
- `src/ui/player/player-controls.tsx`: existing transport and favorite controls.

### Modified files

- `src/types/track.ts`: add `RoomResonanceProfile`.
- `src/types/discovery.ts`: remove `tonightsPicks`; preserve radar types.
- `src/adapters/local_data/track-catalog.ts`: add validated profiles and later replace fictional catalog.
- `src/core/recommendations/rank-recommendations.ts`: accept excluded IDs.
- `src/services/discovery/build-discovery.ts`: return radar only.
- `src/ui/player/use-local-audio.ts`: expose explicit seek and track-change events.
- `src/ui/player/use-player-view.ts`: compose audio, session, candidate, radar, and later queue.
- `src/ui/player/player-page.tsx`: become a small layout composer.
- `app/globals.css`: room variables, related-record states, Chinese panels, responsive and reduced-motion rules.
- `tests/*.test.mjs`: replace obsolete Tonight’s Picks expectations and add feature coverage.
- `README.md`, `CHANGELOG.md`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/TESTING.md`, `docs/ACCEPTANCE.md`: synchronize behavior and boundaries.

---

### Task 0: Establish the Git Execution Baseline

**Files:**
- Inspect: all files reported by `git status --short`
- Commit: existing project state only; no generated `.superpowers/` visual-companion files

**Interfaces:**
- Consumes: the current uncommitted project.
- Produces: one reviewable initial commit from which later task commits can be separated.

- [ ] **Step 1: Ask for explicit baseline approval**

Report that the repository has no commits and all files are untracked. Ask permission to create the first commit before staging anything.

- [ ] **Step 2: Verify ignored and generated paths**

Run:

```powershell
git status --short
git check-ignore -v node_modules dist .next .vinext
```

Expected: project source and documents are untracked; dependency and build directories are ignored.

- [ ] **Step 3: Stage only the existing project baseline**

Run from `rnb_fireplace_radar` after approval:

```powershell
git add .gitignore .openai CHANGELOG.md README.md app build docs eslint.config.mjs next.config.ts package-lock.json package.json postcss.config.mjs public scripts src tests tsconfig.json vite.config.ts worker
git status --short
```

Expected: project files are staged; no `.superpowers/brainstorm` session appears.

- [ ] **Step 4: Create the baseline commit**

```powershell
git commit -m "chore: establish R&B Fireplace Radar baseline"
```

Expected: one root commit succeeds. Stop for user review.

---

### Task 1: Add the Room Resonance Contract and Pure Mapping

**Files:**
- Create: `src/types/room-resonance.ts`
- Create: `src/core/room_resonance/map-room-resonance.ts`
- Modify: `src/types/track.ts`
- Modify: `src/adapters/local_data/track-catalog.ts`
- Test: `tests/room_resonance.test.mjs`
- Modify: `docs/DATA_MODEL.md`
- Modify: `docs/API.md`
- Modify: `docs/TESTING.md`

**Interfaces:**
- Consumes: no new earlier-task interface.
- Produces:
  - `ResonanceLevel = 0 | 1 | 2 | 3 | 4`
  - `RoomResonanceProfile`
  - `RoomVisualState`
  - `mapRoomResonance(profile: RoomResonanceProfile): RoomVisualState`

- [ ] **Step 1: Write the failing room-resonance tests**

Create the complete `tests/room_resonance.test.mjs`:

```js
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleUrl = pathToFileURL(
  join(
    projectRoot,
    "src",
    "core",
    "room_resonance",
    "map-room-resonance.ts",
  ),
).href;

test("testMapsWarmIntimateProfileWhenProfileIsValid", async () => {
  const { mapRoomResonance } = await import(moduleUrl);
  const result = mapRoomResonance({
    emotionTemperature: 4,
    rhythmEnergy: 1,
    productionTexture: 1,
    soundDistance: 0,
    dominantResponse: "lighting",
    relatedCueRatio: 0.55,
  });

  assert.deepEqual(result, {
    warmth: 1,
    fireMotion: 0.25,
    materialClarity: 0.25,
    depth: 0,
    dominantResponse: "lighting",
  });
});

test("testClampsCoolProfileToWarmBrownBaseline", async () => {
  const { mapRoomResonance } = await import(moduleUrl);
  const result = mapRoomResonance({
    emotionTemperature: 0,
    rhythmEnergy: 0,
    productionTexture: 4,
    soundDistance: 4,
    dominantResponse: "depth",
    relatedCueRatio: 0.6,
  });

  assert.equal(result.warmth, 0.2);
  assert.equal(result.fireMotion, 0);
  assert.equal(result.materialClarity, 1);
  assert.equal(result.depth, 1);
  assert.equal(result.dominantResponse, "depth");
});
```

In `tests/track_catalog.test.mjs`, add one test that iterates every catalog
track and asserts that each of the four levels is an integer from `0` through
`4`, `dominantResponse` is one of `lighting/fire/material/depth`, and
`relatedCueRatio > 1 / 3 && relatedCueRatio < 1`.

```js
test("testProvidesValidRoomResonanceWhenCatalogLoads", async () => {
  const { tracks } = await loadCatalogs();
  const validDominantResponses = new Set([
    "lighting",
    "fire",
    "material",
    "depth",
  ]);

  for (const track of tracks) {
    const profile = track.resonance;
    for (const level of [
      profile.emotionTemperature,
      profile.rhythmEnergy,
      profile.productionTexture,
      profile.soundDistance,
    ]) {
      assert.equal(Number.isInteger(level), true);
      assert.ok(level >= 0 && level <= 4);
    }
    assert.equal(
      validDominantResponses.has(profile.dominantResponse),
      true,
    );
    assert.ok(profile.relatedCueRatio > 1 / 3);
    assert.ok(profile.relatedCueRatio < 1);
  }
});
```

- [ ] **Step 2: Run the focused test and verify red**

```powershell
node --test tests/room_resonance.test.mjs
```

Expected: FAIL because `map-room-resonance.ts` does not exist.

- [ ] **Step 3: Add the exact resonance types**

Create:

```ts
export type ResonanceLevel = 0 | 1 | 2 | 3 | 4;

export type DominantResponse =
  | "lighting"
  | "fire"
  | "material"
  | "depth";

export interface RoomResonanceProfile {
  readonly emotionTemperature: ResonanceLevel;
  readonly rhythmEnergy: ResonanceLevel;
  readonly productionTexture: ResonanceLevel;
  readonly soundDistance: ResonanceLevel;
  readonly dominantResponse: DominantResponse;
  readonly relatedCueRatio: number;
}

export interface RoomVisualState {
  readonly warmth: number;
  readonly fireMotion: number;
  readonly materialClarity: number;
  readonly depth: number;
  readonly dominantResponse: DominantResponse;
}
```

Add `readonly resonance: RoomResonanceProfile` to `Track`.

- [ ] **Step 4: Implement the pure mapping**

Create:

```ts
import type {
  ResonanceLevel,
  RoomResonanceProfile,
  RoomVisualState,
} from "../../types/room-resonance.ts";

const MAX_RESONANCE_LEVEL = 4;
const MINIMUM_WARMTH = 0.2;

function normalizeLevel(level: ResonanceLevel): number {
  return level / MAX_RESONANCE_LEVEL;
}

export function mapRoomResonance(
  profile: RoomResonanceProfile,
): RoomVisualState {
  const normalizedWarmth = normalizeLevel(profile.emotionTemperature);

  return {
    warmth:
      MINIMUM_WARMTH +
      normalizedWarmth * (1 - MINIMUM_WARMTH),
    fireMotion: normalizeLevel(profile.rhythmEnergy),
    materialClarity: normalizeLevel(profile.productionTexture),
    depth: normalizeLevel(profile.soundDistance),
    dominantResponse: profile.dominantResponse,
  };
}
```

Add a complete profile to each current catalog track. Keep the existing ten tracks in this task so behavior can be reviewed before licensed media replaces them.

- [ ] **Step 5: Update data/API/testing documentation**

Document all six profile fields, the `0–4` meanings, the warm-brown floor, the pure function signature, and the test coverage. Do not yet describe the UI as implemented.

- [ ] **Step 6: Verify green**

```powershell
node --test tests/room_resonance.test.mjs tests/track_catalog.test.mjs
npm run lint
```

Expected: all focused tests pass and ESLint exits `0`.

- [ ] **Step 7: Commit and stop**

```powershell
git add src/types/room-resonance.ts src/types/track.ts src/core/room_resonance/map-room-resonance.ts src/adapters/local_data/track-catalog.ts tests/room_resonance.test.mjs tests/track_catalog.test.mjs docs/DATA_MODEL.md docs/API.md docs/TESTING.md
git commit -m "feat(resonance): add room state contract"
```

Stop for user confirmation.

---

### Task 2: Add Listening Cycles and Bounded Session History

**Files:**
- Create: `src/types/listening-session.ts`
- Create: `src/core/listening_engagement/listening-cycle.ts`
- Create: `src/core/listening_engagement/session-history.ts`
- Test: `tests/listening_engagement.test.mjs`
- Modify: `docs/API.md`
- Modify: `docs/DATA_MODEL.md`
- Modify: `docs/TESTING.md`

**Interfaces:**
- Consumes: `Track.resonance.relatedCueRatio`.
- Produces:
  - `createListeningCycle(options): ListeningCycle`
  - `updateListeningCycle(cycle, action): ListeningCycle`
  - `isRelatedRecordEligible(cycle): boolean`
  - `appendSessionOutcome(history, outcome): readonly SessionOutcome[]`

- [ ] **Step 1: Write the failing cycle tests**

Create the complete `tests/listening_engagement.test.mjs`:

```js
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const cycleModuleUrl = pathToFileURL(
  join(
    projectRoot,
    "src",
    "core",
    "listening_engagement",
    "listening-cycle.ts",
  ),
).href;
const historyModuleUrl = pathToFileURL(
  join(
    projectRoot,
    "src",
    "core",
    "listening_engagement",
    "session-history.ts",
  ),
).href;

test("testBecomesEligibleWhenListeningAndCueConditionsAreMet", async () => {
  const {
    createListeningCycle,
    isRelatedRecordEligible,
    updateListeningCycle,
  } = await import(cycleModuleUrl);
  const cycle = createListeningCycle({
    trackId: "source",
    durationSeconds: 60,
    relatedCueRatio: 0.5,
  });
  const listened = updateListeningCycle(cycle, {
    type: "time_elapsed",
    playedSeconds: 20,
    positionSeconds: 30,
  });

  assert.equal(isRelatedRecordEligible(listened), true);
});

test("testAllowsOneSeekButDisqualifiesSecondSeek", async () => {
  const { createListeningCycle, updateListeningCycle } =
    await import(cycleModuleUrl);
  const cycle = createListeningCycle({
    trackId: "source",
    durationSeconds: 60,
    relatedCueRatio: 0.5,
  });
  const firstSeek = updateListeningCycle(cycle, { type: "seeked" });
  const secondSeek = updateListeningCycle(firstSeek, { type: "seeked" });

  assert.equal(firstSeek.isDisqualified, false);
  assert.equal(secondSeek.isDisqualified, true);
});

test("testKeepsOnlyThreeMostRecentOutcomes", async () => {
  const { appendSessionOutcome } = await import(historyModuleUrl);
  const history = [
    { trackId: "one", outcome: "heard" },
    { trackId: "two", outcome: "skipped" },
    { trackId: "three", outcome: "heard" },
  ];
  const result = appendSessionOutcome(history, {
    trackId: "four",
    outcome: "skipped",
  });

  assert.deepEqual(result.map((item) => item.trackId), ["two", "three", "four"]);
});

test("testDoesNotCountPausedOrSeekedDistanceAsPlayedTime", async () => {
  const { createListeningCycle, updateListeningCycle } =
    await import(cycleModuleUrl);
  const cycle = createListeningCycle({
    trackId: "source",
    durationSeconds: 60,
    relatedCueRatio: 0.5,
  });
  const paused = updateListeningCycle(cycle, {
    type: "time_elapsed",
    playedSeconds: 0,
    positionSeconds: 10,
  });
  const seeked = updateListeningCycle(paused, { type: "seeked" });
  const afterSeek = updateListeningCycle(seeked, {
    type: "time_elapsed",
    playedSeconds: 1,
    positionSeconds: 31,
  });

  assert.equal(afterSeek.playedSeconds, 1);
  assert.equal(afterSeek.positionSeconds, 31);
  assert.equal(afterSeek.seekCount, 1);
});

test("testCreatesFreshCycleWithoutInheritedState", async () => {
  const { createListeningCycle } = await import(cycleModuleUrl);
  const cycle = createListeningCycle({
    trackId: "next",
    durationSeconds: 50,
    relatedCueRatio: 0.6,
  });

  assert.deepEqual(cycle, {
    trackId: "next",
    durationSeconds: 50,
    relatedCueRatio: 0.6,
    playedSeconds: 0,
    positionSeconds: 0,
    seekCount: 0,
    isDisqualified: false,
  });
});
```

- [ ] **Step 2: Verify red**

```powershell
node --test tests/listening_engagement.test.mjs
```

Expected: FAIL because the listening-engagement modules do not exist.

- [ ] **Step 3: Add the exact cycle types**

```ts
export type SessionOutcomeKind = "heard" | "skipped";

export interface SessionOutcome {
  readonly trackId: string;
  readonly outcome: SessionOutcomeKind;
}

export interface ListeningCycle {
  readonly trackId: string;
  readonly durationSeconds: number;
  readonly relatedCueRatio: number;
  readonly playedSeconds: number;
  readonly positionSeconds: number;
  readonly seekCount: number;
  readonly isDisqualified: boolean;
}

export type ListeningCycleAction =
  | {
      readonly type: "time_elapsed";
      readonly playedSeconds: number;
      readonly positionSeconds: number;
    }
  | { readonly type: "seeked" };
```

- [ ] **Step 4: Implement the pure transitions**

Use named constants:

```ts
const REQUIRED_LISTENING_RATIO = 1 / 3;
const MAX_ALLOWED_SEEKS = 1;
const SESSION_HISTORY_LIMIT = 3;
```

`time_elapsed` adds only its supplied real playback delta and updates position. `seeked` increments `seekCount`; values greater than `MAX_ALLOWED_SEEKS` set `isDisqualified` permanently. Eligibility requires played time at least one third, position at least `durationSeconds * relatedCueRatio`, and no disqualification.

- [ ] **Step 5: Update documentation**

Document that history is memory-only, bounded to three outcomes, and never treats an unclicked recommendation as rejection.

- [ ] **Step 6: Verify green**

```powershell
node --test tests/listening_engagement.test.mjs
npm run lint
```

Expected: all listening tests pass and ESLint exits `0`.

- [ ] **Step 7: Commit and stop**

```powershell
git add src/types/listening-session.ts src/core/listening_engagement/listening-cycle.ts src/core/listening_engagement/session-history.ts tests/listening_engagement.test.mjs docs/API.md docs/DATA_MODEL.md docs/TESTING.md
git commit -m "feat(listening): track related-record eligibility"
```

Stop for user confirmation.

---

### Task 3: Select One Related Candidate and Add Its State Machine

**Files:**
- Create: `src/types/related-record.ts`
- Create: `src/core/related_record/select-related-record.ts`
- Create: `src/core/related_record/related-record-state.ts`
- Modify: `src/core/recommendations/rank-recommendations.ts`
- Modify: `src/types/discovery.ts`
- Modify: `src/services/discovery/build-discovery.ts`
- Create: `src/services/player/build-player-experience.ts`
- Test: `tests/related_record.test.mjs`
- Modify: `tests/recommendation_engine.test.mjs`
- Modify: `docs/API.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/TESTING.md`

**Interfaces:**
- Consumes: `SessionOutcome`, `RecommendedTrack`, existing recommendations.
- Produces:
  - `selectRelatedRecord(options): RecommendedTrack | null`
  - `transitionRelatedRecord(state, action): RelatedRecordState`
  - `buildPlayerExperience(options): PlayerExperience`

- [ ] **Step 1: Replace obsolete three-pick tests with failing single-candidate tests**

Create the complete `tests/related_record.test.mjs`:

```js
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const selectorModuleUrl = pathToFileURL(
  join(
    projectRoot,
    "src",
    "core",
    "related_record",
    "select-related-record.ts",
  ),
).href;
const stateModuleUrl = pathToFileURL(
  join(
    projectRoot,
    "src",
    "core",
    "related_record",
    "related-record-state.ts",
  ),
).href;
const experienceModuleUrl = pathToFileURL(
  join(
    projectRoot,
    "src",
    "services",
    "player",
    "build-player-experience.ts",
  ),
).href;

function createTrack(id) {
  return {
    id,
    title: id,
    artist: "Test Artist",
    album: "Test Album",
    coverUrl: `/assets/covers/${id}.png`,
    previewAudioUrl: `/assets/audio/${id}.mp3`,
    previewDurationSeconds: 50,
    lyricsExcerpt: "",
    tags: {
      genres: ["Neo Soul"],
      moods: ["Warm"],
      voices: ["Close Mic"],
      production: ["Rhodes"],
    },
    listeningNote: "克制的测试聆听笔记。",
    resonance: {
      emotionTemperature: 3,
      rhythmEnergy: 1,
      productionTexture: 2,
      soundDistance: 1,
      dominantResponse: "lighting",
      relatedCueRatio: 0.5,
    },
  };
}

test("testSelectsFirstManualCandidateOutsideSessionHistory", async () => {
  const { selectRelatedRecord } = await import(selectorModuleUrl);
  const currentTrack = createTrack("source");
  const tracks = [
    currentTrack,
    createTrack("manual_first"),
    createTrack("manual_second"),
  ];
  const recommendations = [
    {
      sourceTrackId: "source",
      targetTrackId: "manual_first",
      route: "same_room",
      reason: "第一条人工关系。",
    },
    {
      sourceTrackId: "source",
      targetTrackId: "manual_second",
      route: "similar_voice",
      reason: "第二条人工关系。",
    },
  ];
  const result = selectRelatedRecord({
    currentTrack,
    tracks,
    recommendations,
    excludedTrackIds: new Set(["manual_first"]),
  });

  assert.equal(result?.track.id, "manual_second");
  assert.equal(result?.origin, "manual");
});

test("testReturnsNullWhenNoTrustworthyCandidateExists", async () => {
  const { selectRelatedRecord } = await import(selectorModuleUrl);
  const onlyTrack = createTrack("only");
  const result = selectRelatedRecord({
    currentTrack: onlyTrack,
    tracks: [onlyTrack],
    recommendations: [],
    excludedTrackIds: new Set(),
  });

  assert.equal(result, null);
});

test("testRequiresTwoClicksBeforeConsumption", async () => {
  const { transitionRelatedRecord } = await import(stateModuleUrl);
  const candidate = {
    track: createTrack("target"),
    route: "same_room",
    reason: "温暖、低亮度的编曲气质自然相接。",
    origin: "manual",
  };
  const front = { phase: "front", candidate };
  const back = transitionRelatedRecord(front, { type: "activate" });
  const consumed = transitionRelatedRecord(back, { type: "activate" });

  assert.equal(back.phase, "back");
  assert.equal(consumed.phase, "consumed");
});

test("testDimsAndRestoresWithoutReplacingCandidate", async () => {
  const { transitionRelatedRecord } = await import(stateModuleUrl);
  const candidate = {
    track: createTrack("target"),
    route: "same_room",
    reason: "温暖、低亮度的编曲气质自然相接。",
    origin: "manual",
  };
  const front = { phase: "front", candidate };
  const dimmed = transitionRelatedRecord(front, { type: "dim" });
  const restored = transitionRelatedRecord(dimmed, { type: "restore" });

  assert.equal(dimmed.phase, "dimmed");
  assert.equal(restored.phase, "front");
  assert.equal(restored.candidate.track.id, "target");
});

test("testBuildsRadarAndOneRelatedRecordWithoutPermanentPicks", async () => {
  const { buildPlayerExperience } = await import(experienceModuleUrl);
  const source = createTrack("source");
  const target = createTrack("target");
  const result = buildPlayerExperience({
    currentTrackId: "source",
    tracks: [source, target],
    recommendations: [
      {
        sourceTrackId: "source",
        targetTrackId: "target",
        route: "same_room",
        reason: "温暖、低亮度的编曲气质自然相接。",
      },
    ],
    excludedTrackIds: new Set(),
  });

  assert.equal(result.relatedRecord?.track.id, "target");
  assert.equal(result.radar.same_room[0].track.id, "target");
  assert.equal("tonightsPicks" in result, false);
});
```

In `tests/recommendation_engine.test.mjs`, retain assertions for all four radar
routes and remove every assertion for `tonightsPicks`. Add:

```js
test("testReturnsRadarWithoutPermanentPicksWhenDiscoveryBuilds", async () => {
  const { buildDiscovery, tracks, recommendations } =
    await loadRecommendationModules();
  const result = buildDiscovery({
    currentTrackId: tracks[0].id,
    tracks,
    recommendations,
  });

  assert.equal("tonightsPicks" in result, false);
  radarRoutes.forEach((route) => assert.ok(result.radar[route].length > 0));
});
```

- [ ] **Step 2: Verify red**

```powershell
node --test tests/related_record.test.mjs tests/recommendation_engine.test.mjs
```

Expected: FAIL because the selector and state machine do not exist and the service still returns `tonightsPicks`.

- [ ] **Step 3: Add exact related-record types**

```ts
import type { RecommendedTrack } from "./discovery.ts";

export type RelatedRecordPhase =
  | "hidden"
  | "front"
  | "dimmed"
  | "back"
  | "consumed";

export type RelatedRecordState =
  | { readonly phase: "hidden"; readonly candidate: null }
  | {
      readonly phase: Exclude<RelatedRecordPhase, "hidden">;
      readonly candidate: RecommendedTrack;
    };

export type RelatedRecordAction =
  | {
      readonly type: "reveal";
      readonly candidate: RecommendedTrack;
    }
  | { readonly type: "dim" }
  | { readonly type: "restore" }
  | { readonly type: "activate" }
  | { readonly type: "reset" };
```

- [ ] **Step 4: Implement candidate filtering**

Extend ranking options with `excludedTrackIds: ReadonlySet<string>` and filter both manual and tag-overlap candidates before ranking. `selectRelatedRecord` returns the first ranked valid item mapped to its `Track`, or `null`.

- [ ] **Step 5: Implement legal state transitions**

Use this transition table:

| Current | Action | Next |
| --- | --- | --- |
| hidden | reveal | front |
| front | dim | dimmed |
| dimmed | restore | front |
| front/dimmed | activate | back |
| back | activate | consumed |
| any | reset | hidden |

All unsupported action/state pairs return the current state unchanged.

- [ ] **Step 6: Update discovery and experience services**

`DiscoveryResult` becomes:

```ts
export interface DiscoveryResult {
  readonly radar: RadarRecommendations;
}
```

`PlayerExperience` becomes:

```ts
export interface PlayerExperience {
  readonly radar: RadarRecommendations;
  readonly relatedRecord: RecommendedTrack | null;
  readonly room: RoomVisualState;
}
```

`buildPlayerExperience` receives the current track ID, tracks, recommendations, and excluded IDs. It calls `buildDiscovery`, `selectRelatedRecord`, and `mapRoomResonance` once. The returned related candidate is frozen by the caller for the cycle.

- [ ] **Step 7: Update architecture/API/testing documentation**

Document the selector, state table, empty-candidate behavior, radar separation, and single-candidate service output.

- [ ] **Step 8: Verify green**

```powershell
node --test tests/related_record.test.mjs tests/recommendation_engine.test.mjs
npm run lint
```

Expected: focused tests pass, no `tonightsPicks` service field remains, and ESLint exits `0`.

- [ ] **Step 9: Commit and stop**

```powershell
git add src/types/related-record.ts src/types/discovery.ts src/core/related_record src/core/recommendations/rank-recommendations.ts src/services/discovery/build-discovery.ts src/services/player/build-player-experience.ts tests/related_record.test.mjs tests/recommendation_engine.test.mjs docs/API.md docs/ARCHITECTURE.md docs/TESTING.md
git commit -m "feat(discovery): add one related record"
```

Stop for user confirmation.

---

### Task 4: Connect Audio Events Without Moving Business Rules Into React

**Files:**
- Modify: `src/ui/player/use-local-audio.ts`
- Create: `src/ui/player/use-listening-cycle.ts`
- Create: `src/ui/player/use-related-record.ts`
- Modify: `src/ui/player/use-player-view.ts`
- Test: `tests/player_sync.test.mjs`
- Create: `tests/player_experience.test.mjs`
- Modify: `docs/API.md`
- Modify: `docs/TESTING.md`

**Interfaces:**
- Consumes: Tasks 2–3 core functions and `buildPlayerExperience`.
- Produces:
  - `LocalAudioOptions.onPlaybackDelta`
  - `LocalAudioOptions.onSeeked`
  - `LocalAudioOptions.onTrackSelected`
  - `LocalAudioController.seek` as the only seek action boundary
  - `useListeningCycle(options)`
  - `useRelatedRecord(options)`

- [ ] **Step 1: Write failing integration tests**

Assert source and behavioral boundaries:

```js
assert.match(audioSource, /onPlaybackDelta/);
assert.match(audioSource, /onSeeked/);
assert.match(viewSource, /useListeningCycle/);
assert.match(viewSource, /useRelatedRecord/);
assert.doesNotMatch(viewSource, /seekCount\s*[+]=/);
assert.doesNotMatch(viewSource, /playedSeconds\s*>=\s*durationSeconds\s*\/\s*3/);
```

Add a service test proving that changing `excludedTrackIds` changes the selected candidate but not radar groups.

- [ ] **Step 2: Verify red**

```powershell
node --test tests/player_sync.test.mjs tests/player_experience.test.mjs
```

Expected: FAIL because the hooks and explicit event callbacks do not exist.

- [ ] **Step 3: Add audio event callbacks**

Use an options object:

```ts
interface LocalAudioOptions {
  readonly playlist: readonly Track[];
  readonly onPlaybackDelta: (event: {
    readonly playedSeconds: number;
    readonly positionSeconds: number;
  }) => void;
  readonly onSeeked: () => void;
  readonly onTrackSelected: (event: {
    readonly previousTrackId: string;
    readonly nextTrackId: string;
  }) => void;
}
```

`syncElapsed` calculates real playback delta from the previous time update and never treats a seek jump as played time. `seek` calls `onSeeked` exactly once. All track-selection functions call `onTrackSelected` through one shared path.

- [ ] **Step 4: Add cycle and related-record hooks**

`useListeningCycle` stores the pure `ListeningCycle` and three-entry `SessionOutcome` queue. It dispatches pure actions and creates a new cycle on track selection.

`useRelatedRecord` stores the frozen candidate and pure `RelatedRecordState`. It reveals only when `isRelatedRecordEligible(cycle)` is true and a candidate exists. A single eight-second timer dispatches `dim`; focus/hover dispatch `restore`. Cleanup clears the timer when the track changes or component unmounts.

- [ ] **Step 5: Compose the player view**

`usePlayerView` returns:

```ts
return {
  audioRef,
  player,
  later,
  displayTrack,
  room: experience.room,
  radar: experience.radar,
  relatedRecord,
};
```

It does not expose `tonightsPicks` and does not reselect a candidate while the current cycle is active.

- [ ] **Step 6: Update API/testing documentation**

Document audio-event meanings and explicitly distinguish normal time updates from user seeks.

- [ ] **Step 7: Verify green**

```powershell
node --test tests/player_sync.test.mjs tests/player_experience.test.mjs tests/listening_engagement.test.mjs tests/related_record.test.mjs
npm run lint
```

Expected: focused tests pass and ESLint exits `0`.

- [ ] **Step 8: Commit and stop**

```powershell
git add src/ui/player/use-local-audio.ts src/ui/player/use-listening-cycle.ts src/ui/player/use-related-record.ts src/ui/player/use-player-view.ts tests/player_sync.test.mjs tests/player_experience.test.mjs docs/API.md docs/TESTING.md
git commit -m "feat(player): connect listening cycle events"
```

Stop for user confirmation.

---

### Task 5: Replace the Monolithic Page With Focused Chinese UI Components

**Files:**
- Create: `src/ui/player/turntable-region.tsx`
- Create: `src/ui/player/current-track-panel.tsx`
- Create: `src/ui/player/related-record.tsx`
- Create: `src/ui/player/discovery-panels.tsx`
- Create: `src/ui/player/player-controls.tsx`
- Modify: `src/ui/player/player-page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/step_one_structure.test.mjs`
- Modify: `tests/final_acceptance.test.mjs`
- Modify: `docs/TESTING.md`
- Modify: `docs/ACCEPTANCE.md`

**Interfaces:**
- Consumes: Task 4 `usePlayerView` return value.
- Produces: a page with current music first, room response second, and discovery third.

- [ ] **Step 1: Write failing rendered and source-structure tests**

Replace permanent-picks assertions with:

```js
assert.doesNotMatch(html, /data-section="tonights-picks"/);
assert.doesNotMatch(html, /Tonight’s Picks/);
assert.match(html, /data-region="related-record-slot"/);
assert.match(html, /data-section="radar"/);
assert.match(html, /音乐雷达/);
assert.match(html, /data-section="later"/);
assert.match(html, /稍后播放/);
```

Add source checks that `player-page.tsx` imports the five focused components and does not define them inline. Add an initial-render assertion that no empty related-record card or unlock message appears.

- [ ] **Step 2: Verify red**

```powershell
npm run build
node --test tests/rendered-html.test.mjs tests/step_one_structure.test.mjs tests/final_acceptance.test.mjs
```

Expected: FAIL because Tonight’s Picks still renders and the focused components do not exist.

- [ ] **Step 3: Move existing stable UI into focused components**

Move code without changing behavior first:

- turntable markup to `turntable-region.tsx`;
- current track and listening notes to `current-track-panel.tsx`;
- radar and later rows/disclosures to `discovery-panels.tsx`;
- transport, progress, time, favorite, and audio element to `player-controls.tsx`.

Keep each exported component under 40 lines by extracting private row components into the same file only when each remains focused on that file’s single responsibility.

- [ ] **Step 4: Implement the related-record component**

Use this public contract:

```ts
interface RelatedRecordProps {
  readonly state: RelatedRecordState;
  readonly isInLater: (trackId: string) => boolean;
  readonly onActivate: () => void;
  readonly onAddToLater: (trackId: string) => void;
  readonly onRestore: () => void;
}
```

Render nothing for `hidden`. Front and dimmed phases render a button containing only the project-original cover. Back renders official title, artist, relation reason, a primary “播放这张唱片” activation surface, and a secondary “加入稍后播放” button. The second activation calls the controller that invokes `player.playTrack`.

- [ ] **Step 5: Apply room state through CSS variables**

The room shell receives:

```tsx
style={{
  "--room-warmth": room.warmth,
  "--room-fire-motion": room.fireMotion,
  "--room-material-clarity": room.materialClarity,
  "--room-depth": room.depth,
} as React.CSSProperties}
```

Use only existing warm-brown, cream, champagne, rose, and neutral tokens. Apply `transition-duration: 4.5s` to environmental pseudo-elements and material layers; exclude text, controls, and focus outlines.

- [ ] **Step 6: Add related-record and reduced-motion CSS**

Required phases:

- `front`: short slide, at most `4deg` rotation, and fade in;
- `dimmed`: lower opacity and edge contrast without looping;
- `back`: one quick flip or crossfade;
- `consumed`: no lingering old record.

Under `@media (prefers-reduced-motion: reduce)`, set environmental and record transition durations to `0.01ms`, remove transform animation, and preserve opacity/focus visibility.

- [ ] **Step 7: Finish Chinese interface copy**

Use:

- `音乐雷达`
- `稍后播放`
- `加入稍后播放`
- `从稍后播放移除`
- `播放关联唱片`
- `查看唱片背面`
- `关联唱片背面`

Keep official track metadata unchanged. Do not show scores, “推荐”, “解锁”, or countdown copy.

- [ ] **Step 8: Update testing and acceptance docs**

Record the new page hierarchy, keyboard flow, reduced-motion behavior, and removal of permanent picks.

- [ ] **Step 9: Verify green**

```powershell
npm run build
node --test tests/rendered-html.test.mjs tests/step_one_structure.test.mjs tests/final_acceptance.test.mjs tests/player_sync.test.mjs
npm run lint
```

Expected: build exits `0`, focused UI tests pass, and ESLint exits `0`.

- [ ] **Step 10: Commit and stop**

```powershell
git add src/ui/player app/globals.css tests/rendered-html.test.mjs tests/step_one_structure.test.mjs tests/final_acceptance.test.mjs tests/player_sync.test.mjs docs/TESTING.md docs/ACCEPTANCE.md
git commit -m "feat(ui): add room-object related record"
```

Stop for user confirmation.

---

### Task 6: Integrate the Eight Approved Licensed Previews

**Files:**
- Create: `scripts/verify-media-assets.mjs`
- Create: `public/assets/licenses/music/ATTRIBUTION.md`
- Create: `public/assets/licenses/music/source-evidence.json`
- Replace: current `public/assets/audio/*.wav` with:
  - `public/assets/audio/fire_place.mp3`
  - `public/assets/audio/neo_soul.mp3`
  - `public/assets/audio/unwind.mp3`
  - `public/assets/audio/imma_love_you.mp3`
  - `public/assets/audio/new_meaning.mp3`
  - `public/assets/audio/soul_sync.mp3`
  - `public/assets/audio/brass_railing.mp3`
  - `public/assets/audio/phases_instrumental.mp3`
- Reuse or create project-original covers:
  - `public/assets/covers/fire_place.png`
  - `public/assets/covers/neo_soul.png`
  - `public/assets/covers/unwind.png`
  - `public/assets/covers/imma_love_you.png`
  - `public/assets/covers/new_meaning.png`
  - `public/assets/covers/soul_sync.png`
  - `public/assets/covers/brass_railing.png`
  - `public/assets/covers/phases_instrumental.png`
- Modify: `src/adapters/local_data/track-catalog.ts`
- Modify: `src/adapters/local_data/recommendation-catalog.ts`
- Modify: `tests/track_catalog.test.mjs`
- Modify: `README.md`
- Modify: `docs/DATA_MODEL.md`
- Modify: `docs/TESTING.md`

**Interfaces:**
- Consumes: the eight Stage 1 approved source pages and license rules.
- Produces: eight locally hosted, verified preview tracks with evidence, checksums, attribution, resonance profiles, and curated relations.

- [ ] **Step 1: Reverify each source before downloading**

Use these exact approved source pages:

1. `https://freemusicarchive.org/music/holiznacc0/winter-lofi/fire-place/`
2. `https://freemusicarchive.org/music/mr-smith/a-new-roar/neo-soul/`
3. `https://freemusicarchive.org/music/beat-mekanik/single/unwind-2/`
4. `https://freemusicarchive.org/music/rap-barbie/single/imma-love-you/`
5. `https://freemusicarchive.org/music/pamela-yuen/multigenre-pop-vibes/new-meaning/`
6. `https://freemusicarchive.org/music/Ketsa/cc-by-free-to-use-for-anything/soul-sync/`
7. `https://freemusicarchive.org/music/1000-handz/cc-by-free-to-use-chillstudylounge-instrumentals/brass-railing/`
8. `https://freemusicarchive.org/music/holiznaraps/phases/phases-instrumental/`

For each page, save the retrieval date, resolved download URL, displayed license URL, creator, title, original filename, and SHA-256. Stop the task if any track no longer has CC0 or CC BY permission, does not permit downloading, or returns an HTML/error file instead of audio.

Each `source-evidence.json` entry follows this exact schema:

```ts
interface MusicSourceEvidence {
  readonly trackId: string;
  readonly title: string;
  readonly artist: string;
  readonly sourcePageUrl: string;
  readonly downloadUrl: string;
  readonly licenseName: "CC0 1.0" | "CC BY 4.0";
  readonly licenseUrl: string;
  readonly retrievedAt: string;
  readonly originalFilename: string;
  readonly originalSha256: string;
  readonly previewFilename: string;
  readonly previewSha256: string;
  readonly segmentStartSeconds: number;
  readonly segmentDurationSeconds: number;
  readonly modifications: readonly string[];
}
```

The verification script enforces ISO-8601 UTC `retrievedAt`, 64-character
lowercase hexadecimal hashes, a 45–60 second segment, and the exact
modification statements written to `ATTRIBUTION.md`.

- [ ] **Step 2: Write the failing media-verification tests**

Update catalog tests to require exactly eight unique approved IDs:

```js
const approvedTrackIds = [
  "fire_place",
  "neo_soul",
  "unwind",
  "imma_love_you",
  "new_meaning",
  "soul_sync",
  "brass_railing",
  "phases_instrumental",
];

assert.deepEqual(tracks.map((track) => track.id), approvedTrackIds);
assert.ok(track.previewDurationSeconds >= 45);
assert.ok(track.previewDurationSeconds <= 60);
assert.equal(track.lyricsExcerpt, "");
```

The verification script must reject files without recognized audio magic bytes, previews outside 45–60 seconds, missing SHA-256, missing source evidence, or missing CC BY attribution.

- [ ] **Step 3: Verify red**

```powershell
node --test tests/track_catalog.test.mjs
```

Expected: FAIL because the catalog still contains ten fictional tracks and six-second WAV files.

- [ ] **Step 4: Download to a temporary work directory and verify originals**

Download only after Step 1 succeeds. Do not hotlink source media. Verify each original with `ffprobe` and SHA-256 before editing. Keep downloaded originals under the ignored `work/` directory; do not commit them.

- [ ] **Step 5: Create 45–60 second previews**

For every track, choose a musically coherent segment after listening. Transcode locally, normalize to `-16 LUFS` integrated with `-1.5 dBTP` ceiling, and add short fades. Store the applied start time, duration, normalization, and fade values in `source-evidence.json`.

Use this command shape with concrete per-track values recorded in evidence:

```powershell
ffmpeg -ss 00:00:20 -i work/source-audio/fire_place-original -t 00:00:50 -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.35,afade=t=out:st=49.3:d=0.7" -c:a libmp3lame -b:a 192k public/assets/audio/fire_place.mp3
```

Do not reuse `00:00:20` blindly for the other seven tracks; their recorded segment values must correspond to an audited musical phrase and the preview must remain 45–60 seconds.

- [ ] **Step 6: Replace catalog and relations**

Use the exact IDs above, official title/artist names, empty `lyricsExcerpt`, original project covers, Chinese listening notes, four tag groups, complete resonance profiles, and a cue ratio that corresponds to a marked musical node inside each preview. Add at least one trustworthy manual relation per source track and preserve all four radar routes across the catalog.

- [ ] **Step 7: Add attribution and machine-readable evidence**

`ATTRIBUTION.md` must name every track, artist, FMA source page, license name/link, and modification statement. For example:

```md
- “Neo Soul” — Mr Smith — Free Music Archive — CC BY 4.0.
  Changes: excerpted to 50 seconds, transcoded, loudness-normalized, and given short fades.
```

Include `1000Handz.com` for “Brass Railing”. CC0 “Fire Place” receives voluntary source credit.

- [ ] **Step 8: Verify green**

```powershell
node scripts/verify-media-assets.mjs
node --test tests/track_catalog.test.mjs tests/recommendation_engine.test.mjs tests/room_resonance.test.mjs
npm run build
```

Expected: eight audio previews pass type, duration, checksum, evidence, and attribution checks; catalog/recommendation tests pass; build exits `0`.

- [ ] **Step 9: Commit and stop**

```powershell
git add scripts/verify-media-assets.mjs public/assets/audio public/assets/covers public/assets/licenses/music src/adapters/local_data tests/track_catalog.test.mjs README.md docs/DATA_MODEL.md docs/TESTING.md
git commit -m "feat(catalog): add licensed R&B previews"
```

Stop for user confirmation.

---

### Task 7: Integrate the Approved Visual Resources Without Adding Heavy Runtime Assets

**Files:**
- Create: `public/assets/fonts/instrument-serif/InstrumentSerif-Regular.woff2`
- Create: `public/assets/licenses/visual/ATTRIBUTION.md`
- Create: `public/assets/licenses/visual/source-evidence.json`
- Create:
  - `public/assets/textures/wood027-color.webp`
  - `public/assets/textures/leather022-color.webp`
  - `public/assets/textures/metal007-color.webp`
- Modify: `app/globals.css`
- Modify: `tests/step_one_structure.test.mjs`
- Modify: `tests/final_acceptance.test.mjs`
- Create: `tests/visual_assets.test.mjs`
- Modify: `README.md`
- Modify: `docs/TESTING.md`
- Modify: `docs/ACCEPTANCE.md`

**Interfaces:**
- Consumes: Wood 027, Leather 022, Instrument Serif, native CSS/SVG, native Web animations, and modified Metal 007 approved in Stage 1.
- Produces: local, optimized, license-documented visual assets and restrained room styling.

- [ ] **Step 1: Write failing visual-asset tests**

Assert:

```js
assert.match(css, /@font-face/);
assert.match(css, /Instrument Serif/);
assert.match(css, /wood027/);
assert.match(css, /leather022/);
assert.match(css, /metal007/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(css, /https?:\\/\\//);
```

The asset test must require a license evidence entry and SHA-256 for each external font or texture file.

- [ ] **Step 2: Verify red**

```powershell
node --test tests/visual_assets.test.mjs tests/step_one_structure.test.mjs tests/final_acceptance.test.mjs
```

Expected: FAIL because the approved external files are not present.

- [ ] **Step 3: Reverify and download approved visual files**

Use only:

- `https://ambientcg.com/view?id=Wood027`
- `https://ambientcg.com/view?id=Leather022`
- `https://ambientcg.com/view?id=Metal007`
- `https://github.com/Instrument/instrument-serif`

Download 1K texture packages only. Save source URL, retrieval date, license URL, original filename, and SHA-256. Do not download Fireplace HDRI and do not use source-page screenshots or preview renders.

Each visual evidence entry records `assetId`, `sourcePageUrl`, `licenseName`,
`licenseUrl`, `retrievedAt`, `originalFilename`, `originalSha256`,
`outputFilename`, `outputSha256`, `outputBytes`, and `modifications`.

- [ ] **Step 4: Optimize and scope each asset**

- Wood 027: room shell and turntable-plinth material only.
- Leather 022: small panel or sleeve accents only.
- Metal 007: modified crop for knobs and hardware only.
- Instrument Serif: restrained display use for track title or room signature; keep body and controls on the existing sans-serif stack.
- Native CSS/SVG: grooves, dust, and low-frequency texture only; no new files copied from third-party examples.
- Native Web animation: related-record entry and flip only; no looping decorative motion.

Keep each committed raster texture at or below 400 KB. Prefer WebP or AVIF after visual comparison.

- [ ] **Step 5: Preserve accessibility and performance**

Verify focus outlines remain visible, text contrast does not depend on the texture, reduced motion removes transform animation, and common laptop layouts do not overflow.

- [ ] **Step 6: Update evidence and documentation**

Record CC0/OFL evidence, modifications, file sizes, and usage locations. Document why no new runtime package was introduced.

- [ ] **Step 7: Verify green**

```powershell
node --test tests/visual_assets.test.mjs tests/step_one_structure.test.mjs tests/final_acceptance.test.mjs
npm run build
npm run lint
```

Expected: visual evidence and size tests pass, build exits `0`, and ESLint exits `0`.

- [ ] **Step 8: Commit and stop**

```powershell
git add public/assets/fonts public/assets/textures public/assets/licenses/visual app/globals.css tests/visual_assets.test.mjs tests/step_one_structure.test.mjs tests/final_acceptance.test.mjs README.md docs/TESTING.md docs/ACCEPTANCE.md
git commit -m "feat(visuals): refine fireplace room materials"
```

Stop for user confirmation.

---

### Task 8: Synchronize Final Documentation and Run the Full Acceptance Gate

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/API.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DATA_MODEL.md`
- Modify: `docs/TESTING.md`
- Modify: `docs/ACCEPTANCE.md`
- Modify outside the nested repository:
  `../rnb_fireplace_radar_update_task_list.md`

**Interfaces:**
- Consumes: all accepted results from Tasks 1–7.
- Produces: documentation that exactly matches the shipped behavior and a recorded full verification result.

- [ ] **Step 1: Remove obsolete product claims**

Remove references to fictional tracks, six-second WAV files, permanent three-track Tonight’s Picks, English Radar/Later labels, and the old page hierarchy.

- [ ] **Step 2: Document the final behavior**

Document:

- eight licensed 45–60 second previews;
- attribution and evidence locations;
- room-resonance contract;
- listening-cycle and one-seek rule;
- three-entry session history;
- one frozen related record;
- two-click interaction;
- music radar and later queue roles;
- reduced-motion and Chinese accessibility behavior;
- no rejection control or persistent profile.

- [ ] **Step 3: Record the root cause of removed old behavior**

Add a CHANGELOG entry explaining that the permanent Picks list competed with playback and duplicated discovery responsibilities, so it was replaced at the service and UI contract level rather than hidden with a CSS or conditional patch.

- [ ] **Step 4: Run the complete verification**

```powershell
npm test
npm run lint
node scripts/verify-media-assets.mjs
```

Expected: build succeeds; all Node tests pass with zero failures; ESLint exits `0`; every media and license evidence check passes.

- [ ] **Step 5: Run visual acceptance at required sizes**

Verify:

- `1440 × 900`
- `1366 × 768`
- `1024 × 768`

At each size, check no overlap or clipping, current music remains first, related record appears beside the turntable, radar/later remain usable, Chinese labels fit, and the room transition does not reduce readability. Repeat with reduced motion enabled and keyboard-only navigation.

- [ ] **Step 6: Update the task list only from fresh evidence**

Update `../rnb_fireplace_radar_update_task_list.md` with `apply_patch`. Mark Stage 3 implementation items complete only when their focused task has been accepted. Mark Stage 4 items complete only after Step 4 and Step 5 evidence exists. The task list belongs to the parent workspace and is not staged in the nested project commit.

- [ ] **Step 7: Commit and stop for final acceptance**

```powershell
git add README.md CHANGELOG.md docs
git commit -m "docs: complete room resonance acceptance"
```

Stop for user confirmation. Do not push or deploy until the user separately asks.
