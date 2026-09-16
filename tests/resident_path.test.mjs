import assert from "node:assert/strict";
import test from "node:test";
import { RESIDENT_SPOTS, residentPath, nearestResidentSpot } from "../src/core/vibe/resident-path.ts";

test("all activity points are connected and routes do not cross the coffee table", () => {
  for (const from of Object.keys(RESIDENT_SPOTS)) for (const to of Object.keys(RESIDENT_SPOTS)) {
    const path = residentPath(from, to);
    if (from === to) { assert.deepEqual(path, []); continue; }
    assert.equal(path.at(-1), to);
    const points = [from, ...path].map(key => RESIDENT_SPOTS[key]);
    for (let i = 1; i < points.length; i++) for (let t = 0; t <= 1; t += 0.05) {
      const x = points[i - 1][0] * (1 - t) + points[i][0] * t;
      const z = points[i - 1][1] * (1 - t) + points[i][1] * t;
      assert.ok(!(x > -1.35 && x < 1.1 && z > -0.35 && z < 1.7), `${from} to ${to} crosses table`);
    }
  }
});
test("floor commands reject furniture and points outside the room", () => {
  assert.equal(nearestResidentSpot(0, 0.65), null);
  assert.equal(nearestResidentSpot(20, 20), null);
  assert.equal(nearestResidentSpot(-1.5, 0.6), "sofa");
});
