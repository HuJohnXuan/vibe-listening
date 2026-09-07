import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadAtmosphereBuilder() {
  return import(pathToFileURL(join(projectRoot, "src", "core", "vibe", "build-listening-atmosphere.ts")).href);
}

const track = {
  id: "ember",
  title: "Ember After Midnight",
  artist: "Mara Vale",
  album: "Low Light Letters",
  coverUrl: "/cover.png",
  previewAudioUrl: "/audio.wav",
  previewDurationSeconds: 6,
  lyricsExcerpt: "Leave the lamp low.",
  listeningNote: "余温贴近耳边。",
  tags: { genres: ["Neo Soul"], moods: ["Late Night"], voices: ["Alto"], production: ["Rhodes"] },
};

test("testBuildsSongAtmosphereWhenMemoryIsEmpty", async () => {
  const { buildListeningAtmosphere } = await loadAtmosphereBuilder();
  const atmosphere = buildListeningAtmosphere({ track, memory: "  " });

  assert.equal(atmosphere.title, "这首歌的听歌氛围");
  assert.match(atmosphere.background, /Late Night.*Rhodes/);
  assert.match(atmosphere.memoryEffect, /写下一段/);
});

test("testAddsMemoryToSongAtmosphereWhenMemoryIsProvided", async () => {
  const { buildListeningAtmosphere } = await loadAtmosphereBuilder();
  const atmosphere = buildListeningAtmosphere({ track, memory: "下雨的末班车" });

  assert.equal(atmosphere.title, "记忆加成后的氛围");
  assert.match(atmosphere.memoryEffect, /下雨的末班车/);
  assert.equal(atmosphere.room.weather, "rain");
});

test("room follows explicit memory weather before the track mood", async () => {
  const { buildListeningAtmosphere } = await loadAtmosphereBuilder();
  const warmTrack = { ...track, tags: { ...track.tags, moods: ["Warm"] } };
  assert.equal(buildListeningAtmosphere({ track: warmTrack, memory: "" }).room.name, "落日客厅");
  assert.equal(buildListeningAtmosphere({ track: warmTrack, memory: "冬天窗外的雪" }).room.weather, "snow");
  assert.equal(buildListeningAtmosphere({ track: warmTrack, memory: "下雨的末班车" }).room.name, "雨夜窗边");
  assert.equal(buildListeningAtmosphere({ track: warmTrack, memory: "深夜回家" }).room.name, "深夜唱片室");
  assert.equal(buildListeningAtmosphere({ track: warmTrack, memory: "" }).room.weather, "clear");
});
