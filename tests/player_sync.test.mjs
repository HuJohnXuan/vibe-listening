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

test("testRoutesRecommendationPlaybackAndQueueActionsThroughOneController", () => {
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.match(pageSource, /onPlayTrack=\{player\.playTrack\}/);
  assert.match(pageSource, /onAddToLater=\{player\.addToQueue\}/);
  assert.match(pageSource, /isInLater=\{player\.hasInQueue\}/);
});

test("testProvidesResolvedQueueTracksForPlayAndRemoveActions", () => {
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.match(pageSource, /tracks=\{player\.queueTracks\}/);
  assert.match(pageSource, /onRemoveTrack=\{player\.removeFromQueue\}/);
  assert.match(pageSource, /onPlayTrack=\{player\.playTrack\}/);
});

test("testRecommendationRowDoesNotRequireTheParentPicksCollection", () => {
  const pageSource = readFileSync(playerPagePath, "utf8");

  assert.doesNotMatch(
    pageSource,
    /interface RecommendationRowProps extends TonightsPicksProps/,
  );
});
