import assert from "node:assert/strict";
import test from "node:test";
import { nextRoomWeather, isRoomClick } from "../src/core/vibe/room-interactions.ts";

test("window cycles through all weather states without losing the clear state", () => {
  assert.equal(nextRoomWeather("clear"), "rain");
  assert.equal(nextRoomWeather("rain"), "snow");
  assert.equal(nextRoomWeather("snow"), "clear");
});

test("small pointer jitter is a click but a camera drag is not", () => {
  assert.equal(isRoomClick({ x: 100, y: 100 }, { x: 103, y: 104 }), true);
  assert.equal(isRoomClick({ x: 100, y: 100 }, { x: 107, y: 100 }), false);
  assert.equal(isRoomClick({ x: 100, y: 100 }, { x: 105, y: 105 }), false);
});
