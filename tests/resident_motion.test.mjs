import assert from "node:assert/strict";
import test from "node:test";
import { createResident } from "../src/ui/player/create-resident.ts";
import { Vector3 } from "three";

test("greeting lifts the right hand away from the face, eases in/out and announces only once", () => {
  const announcements = [];
  const resident = createResident(value => announcements.push(value));
  try {
    resident.command("wave");
    const arm = resident.root.getObjectByName("right-arm");
    resident.tick(1 / 30, false, false, false);
    assert.ok(Math.abs(arm.rotation.z) < 0.1, "arm must not snap up on the first frame");
    for (let i = 0; i < 29; i++) resident.tick(1 / 30, false, false, false);
    resident.root.updateMatrixWorld(true);
    const hand = resident.body.worldToLocal(arm.children[1].getWorldPosition(new Vector3()));
    assert.ok(hand.x > 0.65, "raised right hand must stay outside the head silhouette");
    assert.ok(arm.rotation.z > 1.8);
    for (let i = 0; i < 50; i++) resident.tick(1 / 30, false, false, false);
    assert.ok(Math.abs(arm.rotation.z) < 0.1, "arm returns to its resting pose");
    assert.equal(announcements.filter(x => x === "住客向你挥手").length, 1);
  } finally { resident.dispose(); }
});

test("a new instruction finishes its corridor before taking a safe route to the latest goal", () => {
  let status = "";
  const resident = createResident(value => { status = value; });
  try {
    resident.command("window");
    for (let i = 0; i < 12; i++) resident.tick(1 / 30, false, false, false);
    resident.command("records");
    for (let i = 0; i < 450; i++) {
      resident.tick(1 / 30, false, false, false);
      const {x, z} = resident.root.position;
      assert.ok(!(x > -1.35 && x < 1.1 && z > -0.35 && z < 1.7));
    }
    assert.match(status, /听你的安排.*挑唱片/);
    assert.equal(resident.root.position.x, 2.5);
    assert.equal(resident.root.position.z, -0.65);
  } finally { resident.dispose(); }
});
test("reduced motion resolves a multi-segment instruction in a single update and suppresses roaming", () => {
  const resident = createResident(() => {});
  try {
    resident.command("records"); resident.tick(1 / 30, true, true, false);
    assert.equal(resident.root.position.x, 2.5);
    assert.equal(resident.root.position.z, -0.65);
    resident.command("auto");
    for (let i = 0; i < 50; i++) resident.tick(1, true, true, true);
    assert.equal(resident.root.position.x, 2.5);
    resident.command("sofa"); resident.tick(1 / 30, false, true, false);
    assert.equal(resident.body.position.z, -0.64);
    resident.setVisible(false);
    assert.equal(resident.root.visible, false);
  } finally { resident.dispose(); }
});
