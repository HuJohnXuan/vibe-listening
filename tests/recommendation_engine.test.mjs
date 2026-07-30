import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const discoveryServicePath = join(
  projectRoot,
  "src",
  "services",
  "discovery",
  "build-discovery.ts",
);
const trackCatalogPath = join(
  projectRoot,
  "src",
  "adapters",
  "local_data",
  "track-catalog.ts",
);
const recommendationCatalogPath = join(
  projectRoot,
  "src",
  "adapters",
  "local_data",
  "recommendation-catalog.ts",
);
const radarRoutes = [
  "same_artist",
  "same_room",
  "similar_voice",
  "production_texture",
];

async function loadRecommendationModules() {
  assert.equal(
    existsSync(discoveryServicePath),
    true,
    "Discovery service must exist",
  );

  const [serviceModule, trackModule, recommendationModule] = await Promise.all([
    import(pathToFileURL(discoveryServicePath).href),
    import(pathToFileURL(trackCatalogPath).href),
    import(pathToFileURL(recommendationCatalogPath).href),
  ]);

  return {
    buildDiscovery: serviceModule.buildDiscovery,
    tracks: trackModule.tracks,
    recommendations: recommendationModule.recommendations,
  };
}

function createTrack({
  id,
  artist = "Test Artist",
  genres = [],
  moods = [],
  voices = [],
  production = [],
}) {
  return {
    id,
    title: id,
    artist,
    album: "Test Album",
    coverUrl: `/assets/covers/${id}.png`,
    previewAudioUrl: `/assets/audio/${id}.wav`,
    previewDurationSeconds: 6,
    lyricsExcerpt: "A quiet original line for this test.",
    tags: { genres, moods, voices, production },
    listeningNote: "A restrained listening note for this test track.",
  };
}

test("testReturnsThreeReasonedPicksWhenCatalogTrackIsSelected", async () => {
  const { buildDiscovery, tracks, recommendations } =
    await loadRecommendationModules();

  for (const track of tracks) {
    const result = buildDiscovery({
      currentTrackId: track.id,
      tracks,
      recommendations,
    });

    assert.equal(result.tonightsPicks.length, 3);
    result.tonightsPicks.forEach((pick) => {
      assert.notEqual(pick.track.id, track.id);
      assert.ok(pick.reason.trim().length >= 12);
    });
    radarRoutes.forEach((route) => assert.ok(result.radar[route].length > 0));
  }
});

test("testKeepsManualRelationsFirstWhenDiscoveryBuilds", async () => {
  const { buildDiscovery, tracks, recommendations } =
    await loadRecommendationModules();
  const currentTrackId = tracks[0].id;
  const manualTargets = recommendations
    .filter((item) => item.sourceTrackId === currentTrackId)
    .slice(0, 3)
    .map((item) => item.targetTrackId);

  const result = buildDiscovery({ currentTrackId, tracks, recommendations });

  assert.deepEqual(
    result.tonightsPicks.map((pick) => pick.track.id),
    manualTargets,
  );
});

test("testUsesTagOverlapWhenManualRelationsAreInsufficient", async () => {
  const { buildDiscovery } = await loadRecommendationModules();
  const tracks = [
    createTrack({
      id: "source",
      genres: ["Neo Soul"],
      moods: ["Warm"],
      voices: ["Velvet"],
      production: ["Rhodes"],
    }),
    createTrack({ id: "manual" }),
    createTrack({
      id: "strong_overlap",
      genres: ["Neo Soul"],
      moods: ["Warm"],
      voices: ["Velvet"],
      production: ["Rhodes"],
    }),
    createTrack({ id: "light_overlap", moods: ["Warm"] }),
  ];
  const recommendations = [
    {
      sourceTrackId: "source",
      targetTrackId: "manual",
      route: "same_room",
      reason: "人工关系应当始终排在标签回退结果之前。",
    },
  ];

  const result = buildDiscovery({
    currentTrackId: "source",
    tracks,
    recommendations,
  });

  assert.deepEqual(
    result.tonightsPicks.map((pick) => pick.track.id),
    ["manual", "strong_overlap", "light_overlap"],
  );
});

test("testReturnsEmptyGroupsWhenNoOtherTrackExists", async () => {
  const { buildDiscovery } = await loadRecommendationModules();
  const tracks = [createTrack({ id: "only_track" })];

  const result = buildDiscovery({
    currentTrackId: "only_track",
    tracks,
    recommendations: [],
  });

  assert.deepEqual(result.tonightsPicks, []);
  radarRoutes.forEach((route) => assert.deepEqual(result.radar[route], []));
});

test("testRejectsUnknownTrackWhenDiscoveryBuilds", async () => {
  const { buildDiscovery } = await loadRecommendationModules();

  assert.throws(
    () =>
      buildDiscovery({
        currentTrackId: "missing",
        tracks: [createTrack({ id: "known" })],
        recommendations: [],
      }),
    (error) =>
      error.code === "TRACK_NOT_FOUND" &&
      error.context.currentTrackId === "missing",
  );
});

test("testDeduplicatesTargetsWhenManualRelationsRepeat", async () => {
  const { buildDiscovery } = await loadRecommendationModules();
  const tracks = [
    createTrack({ id: "source", moods: ["Warm"] }),
    createTrack({ id: "target", moods: ["Warm"] }),
  ];
  const relation = {
    sourceTrackId: "source",
    targetTrackId: "target",
    route: "same_room",
    reason: "重复关系不应让同一首歌曲在推荐列表中出现两次。",
  };

  const result = buildDiscovery({
    currentTrackId: "source",
    tracks,
    recommendations: [relation, relation],
  });

  assert.equal(result.tonightsPicks.length, 1);
  assert.equal(result.tonightsPicks[0].track.id, "target");
});
