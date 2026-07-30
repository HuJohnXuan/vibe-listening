import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const playerStatePath = join(
  projectRoot,
  "src",
  "core",
  "player",
  "player-state.ts",
);

async function loadPlayerState() {
  assert.equal(
    existsSync(playerStatePath),
    true,
    "Player state module must exist",
  );

  return import(pathToFileURL(playerStatePath).href);
}

test("testWrapsTrackIndexWhenPreviousOrNextIsSelected", async () => {
  const { getNextTrackIndex, getPreviousTrackIndex } =
    await loadPlayerState();

  assert.equal(getNextTrackIndex(9, 10), 0);
  assert.equal(getPreviousTrackIndex(0, 10), 9);
  assert.equal(getNextTrackIndex(3, 10), 4);
  assert.equal(getPreviousTrackIndex(3, 10), 2);
});

test("testFormatsPlaybackTimeWhenSecondsAreProvided", async () => {
  const { formatPlaybackTime } = await loadPlayerState();

  assert.equal(formatPlaybackTime(0), "0:00");
  assert.equal(formatPlaybackTime(65.9), "1:05");
  assert.equal(formatPlaybackTime(Number.NaN), "0:00");
});

test("testFindsTrackIndexWhenRecommendationIsSelected", async () => {
  const { getTrackIndexById } = await loadPlayerState();
  const tracks = [{ id: "ember" }, { id: "satin" }, { id: "bloom" }];

  assert.equal(getTrackIndexById(tracks, "satin"), 1);
  assert.equal(getTrackIndexById(tracks, "missing"), -1);
  assert.equal(getTrackIndexById([], "ember"), -1);
});
