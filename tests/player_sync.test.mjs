import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const playerViewPath = join(
  projectRoot,
  "src",
  "ui",
  "player",
  "use-player-view.ts",
);
const playerPagePath = join(
  projectRoot,
  "src",
  "ui",
  "player",
  "player-page.tsx",
);

test("testUsesPlayingAudioTrackAsSingleCurrentTrackSource", () => {
  assert.equal(
    existsSync(playerViewPath),
    true,
    "Synchronized player view hook must exist",
  );

  const viewSource = readFileSync(playerViewPath, "utf8");
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.match(viewSource, /const displayTrack = player\.audioTrack/);
  assert.match(viewSource, /currentTrackId:\s*displayTrack\.id/);
  assert.match(pageSource, /track=\{displayTrack\}/);
  assert.match(pageSource, /picks=\{discovery\.tonightsPicks\}/);
  assert.match(pageSource, /radar=\{discovery\.radar\}/);
});

test("testRoutesRecommendationPlaybackAndLaterActionsThroughControllers", () => {
  const viewSource = readFileSync(playerViewPath, "utf8");
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.match(viewSource, /const userState = useUserState\(playlist\)/);
  assert.match(viewSource, /const later = userState\.later/);
  assert.match(pageSource, /onPlayTrack=\{player\.playTrack\}/);
  assert.match(pageSource, /onAddToLater=\{later\.addTrack\}/);
  assert.match(pageSource, /isInLater=\{later\.hasTrack\}/);
});

test("testProvidesResolvedLaterTracksForPlayAndRemoveActions", () => {
  const viewSource = readFileSync(playerViewPath, "utf8");
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.match(viewSource, /const later = userState\.later/);
  assert.match(pageSource, /tracks=\{later\.tracks\}/);
  assert.match(pageSource, /onRemoveTrack=\{later\.removeTrack\}/);
  assert.match(pageSource, /onPlayTrack=\{player\.playTrack\}/);
});

test("testConnectsUserStateSynchronizerAndReportsPlaybackStart", () => {
  const userStatePath = join(projectRoot, "src", "ui", "player", "use-user-state.ts");
  const audioPath = join(projectRoot, "src", "ui", "player", "use-local-audio.ts");
  const userStateSource = readFileSync(userStatePath, "utf8");
  const audioSource = readFileSync(audioPath, "utf8");

  assert.match(userStateSource, /new UserStateSynchronizer\(client\)/);
  assert.match(userStateSource, /createUnavailableUserStateClient\(\)/);
  assert.match(userStateSource, /synchronizer\.subscribe\(setSnapshot\)/);
  assert.match(userStateSource, /synchronizer\.hydrate\(\)/);
  assert.match(userStateSource, /playbackHistory: state\.playbackHistory/);
  assert.match(userStateSource, /replacePreferences\(preferences\)/);
  assert.match(userStateSource, /recordPlaybackStart\(trackId\)/);
  assert.match(audioSource, /onPlaybackStart\(audioTrack\.id\)/);
});
