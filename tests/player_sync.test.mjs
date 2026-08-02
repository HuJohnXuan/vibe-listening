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

  assert.match(viewSource, /const later = useLaterQueue\(playlist\)/);
  assert.match(pageSource, /onPlayTrack=\{player\.playTrack\}/);
  assert.match(pageSource, /onAddToLater=\{later\.addTrack\}/);
  assert.match(pageSource, /isInLater=\{later\.hasTrack\}/);
});

test("testProvidesResolvedLaterTracksForPlayAndRemoveActions", () => {
  const viewSource = readFileSync(playerViewPath, "utf8");
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.match(viewSource, /const later = useLaterQueue\(playlist\)/);
  assert.match(pageSource, /tracks=\{later\.tracks\}/);
  assert.match(pageSource, /onRemoveTrack=\{later\.removeTrack\}/);
  assert.match(pageSource, /onPlayTrack=\{player\.playTrack\}/);
});

test("testRecommendationRowDoesNotRequireTheParentPicksCollection", () => {
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.doesNotMatch(
    pageSource,
    /interface RecommendationRowProps extends TonightsPicksProps/,
  );
});
