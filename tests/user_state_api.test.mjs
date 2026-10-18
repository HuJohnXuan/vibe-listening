import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function importProjectFile(...segments) {
  return import(pathToFileURL(join(projectRoot, ...segments)).href);
}

test("testCreatesAndReusesAnonymousDeviceId", async () => {
  const { getOrCreateDeviceId } = await importProjectFile(
    "src", "services", "user_state", "device-identity.ts",
  );
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  const firstId = "2f1d9e13-dde1-4c41-bf2a-3e927b0734f4";
  const secondId = "0f66564f-2a53-43f6-a5bb-4f815c58ccd7";
  assert.equal(getOrCreateDeviceId(storage, () => firstId), firstId);
  assert.equal(getOrCreateDeviceId(storage, () => secondId), firstId);
});

test("testReplacesMalformedStoredAnonymousDeviceId", async () => {
  const { getOrCreateDeviceId } = await importProjectFile(
    "src", "services", "user_state", "device-identity.ts",
  );
  const values = new Map([["rnb-fireplace-radar.device-id", "invalid"]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const validId = "2f1d9e13-dde1-4c41-bf2a-3e927b0734f4";

  assert.equal(getOrCreateDeviceId(storage, () => validId), validId);
});

test("testUserStateClientSendsDeviceHeaderAndApiBody", async () => {
  const { createUserStateClient } = await importProjectFile(
    "src", "adapters", "user_state_api", "user-state-client.ts",
  );
  const requests = [];
  const fetcher = async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({
      favorites: [], later: [], playbackHistory: [],
      preferences: { theme: "default", displayOptions: {}, musicTags: [] },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const client = createUserStateClient({
    apiBaseUrl: "https://api.example.test",
    deviceId: "device-one",
    fetcher,
  });

  await client.replaceLater(["slow-bloom"]);

  assert.equal(requests[0].url, "https://api.example.test/api/v1/later");
  assert.equal(requests[0].init.headers["X-Device-Id"], "device-one");
  assert.equal(requests[0].init.body, JSON.stringify({ trackIds: ["slow-bloom"] }));
});
