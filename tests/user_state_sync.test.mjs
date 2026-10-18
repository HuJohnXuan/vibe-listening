import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleUrl = pathToFileURL(join(
  projectRoot, "src", "services", "user_state", "user-state-synchronizer.ts",
)).href;

const emptyState = {
  favorites: [], later: [], playbackHistory: [],
  preferences: { theme: "default", displayOptions: {}, musicTags: [] },
};

function deferred() {
  let resolve;
  const promise = new Promise((nextResolve) => { resolve = nextResolve; });
  return { promise, resolve };
}

test("testPreservesLocalMutationWhenHydrationFinishesLater", async () => {
  const { UserStateSynchronizer } = await import(moduleUrl);
  const remote = deferred();
  const laterWrites = [];
  const client = createClient({
    getState: () => remote.promise,
    replaceLater: async (trackIds) => {
      laterWrites.push([...trackIds]);
      return { ...emptyState, later: [...trackIds] };
    },
  });
  const synchronizer = new UserStateSynchronizer(client);

  const hydration = synchronizer.hydrate();
  synchronizer.addLaterTrack("local-track");
  remote.resolve({ ...emptyState, later: ["remote-track"] });
  await hydration;
  await synchronizer.whenIdle();

  assert.deepEqual(synchronizer.getSnapshot().state.later, ["remote-track", "local-track"]);
  assert.deepEqual(laterWrites.at(-1), ["remote-track", "local-track"]);
});

test("testSerializesRapidWritesAndKeepsNewestLaterState", async () => {
  const { UserStateSynchronizer } = await import(moduleUrl);
  const firstWrite = deferred();
  let activeWrites = 0;
  let maximumActiveWrites = 0;
  let writeCount = 0;
  const client = createClient({
    replaceLater: async (trackIds) => {
      activeWrites += 1;
      maximumActiveWrites = Math.max(maximumActiveWrites, activeWrites);
      writeCount += 1;
      if (writeCount === 1) await firstWrite.promise;
      activeWrites -= 1;
      return { ...emptyState, later: [...trackIds] };
    },
  });
  const synchronizer = new UserStateSynchronizer(client);
  await synchronizer.hydrate();

  synchronizer.addLaterTrack("first");
  synchronizer.addLaterTrack("second");
  firstWrite.resolve();
  await synchronizer.whenIdle();

  assert.equal(maximumActiveWrites, 1);
  assert.deepEqual(synchronizer.getSnapshot().state.later, ["first", "second"]);
});

test("testRestoresHistoryAndPreferencesAndClearsRecoveredError", async () => {
  const { UserStateSynchronizer } = await import(moduleUrl);
  let failPreferences = true;
  const client = createClient({
    getState: async () => ({
      ...emptyState,
      playbackHistory: [{ trackId: "old", startedAt: "2026-08-01T00:00:00Z" }],
      preferences: { theme: "night", displayOptions: { showArtwork: true }, musicTags: ["neo-soul"] },
    }),
    replacePreferences: async () => {
      if (failPreferences) throw new Error("offline");
      return emptyState;
    },
  });
  const synchronizer = new UserStateSynchronizer(client);
  await synchronizer.hydrate();
  assert.equal(synchronizer.getSnapshot().state.playbackHistory[0].trackId, "old");
  assert.equal(synchronizer.getSnapshot().state.preferences.theme, "night");

  synchronizer.replacePreferences({ theme: "warm", displayOptions: {}, musicTags: [] });
  await synchronizer.whenIdle();
  assert.notEqual(synchronizer.getSnapshot().syncError, "");
  failPreferences = false;
  synchronizer.replacePreferences({ theme: "warm", displayOptions: {}, musicTags: ["quiet"] });
  await synchronizer.whenIdle();
  assert.equal(synchronizer.getSnapshot().syncError, "");
});

test("testKeepsErrorWhenDifferentResourceStillHasFailedWrite", async () => {
  const { UserStateSynchronizer } = await import(moduleUrl);
  const client = createClient({
    addFavorite: async () => { throw new Error("offline"); },
  });
  const synchronizer = new UserStateSynchronizer(client);
  await synchronizer.hydrate();

  synchronizer.toggleFavorite("favorite-track");
  synchronizer.addLaterTrack("later-track");
  await synchronizer.whenIdle();

  assert.notEqual(synchronizer.getSnapshot().syncError, "");
  assert.deepEqual(synchronizer.getSnapshot().state.favorites, ["favorite-track"]);
  assert.deepEqual(synchronizer.getSnapshot().state.later, ["later-track"]);
});

test("testAppliesCanonicalServerHistoryTimestampWhenRevisionIsCurrent", async () => {
  const { UserStateSynchronizer } = await import(moduleUrl);
  const canonical = {
    ...emptyState,
    playbackHistory: [{ trackId: "played", startedAt: "2026-08-02T03:00:00Z" }],
  };
  const client = createClient({ recordPlaybackStart: async () => canonical });
  const synchronizer = new UserStateSynchronizer(client);
  await synchronizer.hydrate();

  synchronizer.recordPlaybackStart("played");
  await synchronizer.whenIdle();

  assert.deepEqual(synchronizer.getSnapshot().state.playbackHistory, canonical.playbackHistory);
});

function createClient(overrides = {}) {
  const resolve = async () => emptyState;
  return {
    getState: resolve, addFavorite: resolve, removeFavorite: resolve,
    replaceLater: resolve, recordPlaybackStart: resolve, replacePreferences: resolve,
    ...overrides,
  };
}
