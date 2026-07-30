import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const laterQueuePath = join(
  projectRoot,
  "src",
  "core",
  "later",
  "later-queue.ts",
);

async function loadLaterQueue() {
  assert.equal(
    existsSync(laterQueuePath),
    true,
    "Later queue core must exist",
  );

  return import(pathToFileURL(laterQueuePath).href);
}

test("testAddsTrackOnceWhenRecommendationIsSavedForLater", async () => {
  const { addTrackToLater } = await loadLaterQueue();

  assert.deepEqual(addTrackToLater([], "slow_bloom"), ["slow_bloom"]);
  assert.deepEqual(
    addTrackToLater(["slow_bloom"], "slow_bloom"),
    ["slow_bloom"],
  );
});

test("testReportsWhetherTrackIsAlreadySavedForLater", async () => {
  const { hasTrackInLater } = await loadLaterQueue();
  const queue = ["slow_bloom", "honey_static"];

  assert.equal(hasTrackInLater(queue, "honey_static"), true);
  assert.equal(hasTrackInLater(queue, "satin_window"), false);
  assert.equal(hasTrackInLater([], "slow_bloom"), false);
});

test("testRemovesOnlySelectedTrackWhenLaterItemIsRemoved", async () => {
  const { removeTrackFromLater } = await loadLaterQueue();
  const queue = ["slow_bloom", "honey_static", "satin_window"];

  assert.deepEqual(
    removeTrackFromLater(queue, "honey_static"),
    ["slow_bloom", "satin_window"],
  );
  assert.deepEqual(removeTrackFromLater(queue, "missing"), queue);
  assert.deepEqual(removeTrackFromLater([], "slow_bloom"), []);
});

test("testResolvesLaterTracksInQueueOrderAndSkipsMissingIds", async () => {
  const { resolveLaterTracks } = await loadLaterQueue();
  const tracks = [
    { id: "slow_bloom", title: "Slow Bloom" },
    { id: "honey_static", title: "Honey Static" },
  ];

  assert.deepEqual(
    resolveLaterTracks(["missing", "honey_static", "slow_bloom"], tracks),
    [tracks[1], tracks[0]],
  );
  assert.deepEqual(resolveLaterTracks([], tracks), []);
});
