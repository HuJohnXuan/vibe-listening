import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RESIDENT_SPOTS, residentPath, type ResidentCommand, type ResidentSpot } from "../../core/vibe/resident-path.ts";
import type { RoomType } from "../../core/vibe/room-presets.ts";

export function createResident(onStatus: (value: string) => void) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const mats = ["#eed4ac", "#555d36", "#45372f", "#30241f", "#211d19", "#555d36", "#45372f", "#30241f", "#eee2cf"].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
  const geometry: THREE.BufferGeometry[] = [];
  function part(parent: THREE.Object3D, size: number[], pos: number[], mat: number, radius = 0.08) {
    const geo = new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius);
    geometry.push(geo);
    const mesh = new THREE.Mesh(geo, mats[mat]);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = false; // Preserve the room's static shadow map; use a contact shadow below.
    parent.add(mesh);
    return mesh;
  }
  function joint(parent: THREE.Object3D, x: number, y: number, z: number) {
    const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group); return group;
  }
  function oval(parent: THREE.Object3D, size: number[], pos: number[], mat: number) {
    const geo = new THREE.SphereGeometry(0.5, 24, 18); geometry.push(geo);
    const mesh = new THREE.Mesh(geo, mats[mat]);
    mesh.scale.set(size[0], size[1], size[2]); mesh.position.set(pos[0], pos[1], pos[2]); parent.add(mesh);
    return mesh;
  }
  part(body, [0.55, 0.64, 0.35], [0, 1.08, 0], 5, 0.11);
  const jacketOpening = part(body, [0.14, 0.54, 0.03], [0, 1.1, 0.181], 8, 0.01);
  jacketOpening.visible = false;
  part(body, [0.16, 0.13, 0.16], [0, 1.42, 0], 0, 0.04);
  const head = joint(body, 0, 1.78, 0);
  oval(head, [0.75, 0.7, 0.62], [0, 0, 0], 0);
  // Only eyes: no nose, mouth or nose-shaped profile geometry.
  for (const x of [-0.15, 0.15]) oval(head, [0.055, 0.105, 0.036], [x, -0.025, 0.282], 4);
  oval(head, [0.78, 0.42, 0.66], [0, 0.19, -0.06], 3);
  oval(head, [0.72, 0.58, 0.3], [0, 0.04, -0.21], 3);
  const fringe = oval(head, [0.57, 0.22, 0.2], [-0.1, 0.23, 0.21], 3);
  fringe.rotation.z = 0.3;
  const fringeSide = oval(head, [0.21, 0.32, 0.19], [-0.29, 0.1, 0.16], 3);
  fringeSide.rotation.z = -0.3;
  const bandGeo = new THREE.TorusGeometry(0.41, 0.032, 8, 28, Math.PI);
  geometry.push(bandGeo);
  const band = new THREE.Mesh(bandGeo, mats[2]); band.position.set(0, 0.05, -0.02); head.add(band);
  for (const x of [-0.4, 0.4]) {
    oval(head, [0.16, 0.34, 0.3], [x, -0.005, -0.02], 2);
    oval(head, [0.045, 0.25, 0.22], [x * 1.16, -0.005, -0.02], 3);
  }
  const arms = [-1, 1].map(side => {
    const arm = joint(body, side * 0.33, 1.32, 0);
    arm.name = side > 0 ? "right-arm" : "left-arm";
    part(arm, [0.21, 0.46, 0.26], [0, -0.2, 0], 5, 0.08);
    part(arm, [0.16, 0.19, 0.19], [0, -0.47, 0.02], 0, 0.07);
    return arm;
  });
  const legs = [-1, 1].map(side => {
    const hip = joint(body, side * 0.15, 0.78, 0);
    part(hip, [0.25, 0.35, 0.3], [0, -0.16, 0], 6, 0.05);
    const knee = joint(hip, 0, -0.32, 0);
    const calf = part(knee, [0.24, 0.34, 0.29], [0, -0.15, 0], 6, 0.04);
    const foot = part(knee, [0.27, 0.15, 0.39], [0, -0.35, 0.065], 7, 0.06);
    return { hip, knee, calf, foot };
  });
  const shadowGeo = new THREE.CircleGeometry(0.38, 32); geometry.push(shadowGeo);
  const shadowMat = new THREE.MeshBasicMaterial({ color: "#261b13", transparent: true, opacity: 0.14, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.075; root.add(shadow);

  root.position.set(-1.5, 0, 2.3); root.rotation.y = 0.6;
  let spot: ResidentSpot = "frontLeft";
  let route: ResidentSpot[] = [];
  let goal: ResidentSpot = spot;
  let pending: ResidentSpot | null = null;
  let behavior = "idle";
  let auto = true;
  let wait = 5;
  let t = 0;
  let sit = 0;
  let wave = 0;
  let hidden = false;
  let previousStatus = "";
  function status(value: string) { if (value !== previousStatus) { previousStatus = value; onStatus(value); } }
  function travel(target: ResidentSpot) {
    goal = target;
    // Finish the current corridor segment before re-routing; never cut through furniture.
    if (route.length) { pending = target; return; }
    route = residentPath(spot, target);
    behavior = route.length ? "walk" : target;
    wait = auto ? 14 + Math.random() * 12 : 22;
  }
  function command(value: ResidentCommand | ResidentSpot) {
    if (value !== "wave") wave = 0;
    if (value === "auto") { auto = true; wait = 0; return; }
    auto = false; wait = 22;
    if (value === "wave") { wave = 2.5; return; }
    if (value === "sway") { travel("front"); behavior = route.length ? "walk" : "sway"; return; }
    travel(value);
  }
  function tick(dt: number, playing: boolean, reduced: boolean, rainy: boolean, energy = 0.5) {
    if (hidden) return;
    t += dt;
    if (reduced && route.length) {
      spot = pending ?? goal; goal = spot; pending = null; route = [];
      const p = RESIDENT_SPOTS[spot]; root.position.set(p[0], 0, p[1]); behavior = spot;
    }
    const targetSit = !route.length && behavior === "sofa" ? 1 : 0;
    sit = reduced ? targetSit : THREE.MathUtils.damp(sit, targetSit, 5, dt);
    if (sit > 0.01 && route.length) {
    if (wave <= 0) status("住客正在起身");
    } else if (route.length) {
      const next = route[0]; const p = RESIDENT_SPOTS[next];
      const dx = p[0] - root.position.x, dz = p[1] - root.position.z;
      const distance = Math.hypot(dx, dz);
      const step = reduced ? distance : Math.min(distance, dt * 0.75);
      if (distance > 0.001) { root.position.x += dx / distance * step; root.position.z += dz / distance * step; root.rotation.y = Math.atan2(dx, dz); }
      if (distance <= step + 0.001) {
        root.position.set(p[0], 0, p[1]);
        spot = route.shift()!;
        if (pending) { goal = pending; pending = null; route = residentPath(spot, goal); }
        if (!route.length) { behavior = goal; wait = auto ? 14 + Math.random() * 12 : 22; }
      }
      if (wave <= 0) status("住客正在走过去");
    } else {
      if (!reduced) wait -= dt;
      if (wait <= 0 && !reduced) {
        auto = true;
        const choices: ResidentSpot[] = rainy ? ["window", "window", "sofa", "records"] : ["sofa", "window", "records", "front"];
        const options = choices.filter(x => x !== spot);
        travel(options[Math.floor(Math.random() * options.length)]);
      }
      if (behavior === "sofa") root.rotation.y = Math.PI / 2;
      if (behavior === "window") root.rotation.y = Math.PI;
      if (behavior === "records") root.rotation.y = Math.PI;
      const labels: Record<string, string> = { sofa: "坐着听歌", window: "在窗边看风景", records: "在挑唱片", front: "在听音乐", sway: "跟着音乐轻晃" };
      if (wave <= 0) status(`${auto ? "自由活动" : "听你的安排"} · ${labels[behavior] ?? "安静待着"}`);
    }
    wave = Math.max(0, wave - dt);
    const walking = route.length > 0 && sit < 0.02 && !reduced;
    const swing = walking ? Math.sin(t * 7) * 0.45 : 0;
    const sway = playing && !walking && !reduced ? Math.sin(t * (1.3 + energy)) * (0.015 + energy * 0.04) : 0;
    // Pull back into the sofa in the character's local frame after reaching its clear approach.
    body.position.set(0, 0.07 * sit + (walking ? Math.abs(Math.sin(t * 7)) * 0.025 : 0), -0.64 * sit);
    body.rotation.z = sway;
    head.rotation.z = sway * 0.5;
    arms.forEach((arm, i) => { arm.rotation.set(-sit * 0.65 + (i ? swing : -swing), 0, (i ? -1 : 1) * 0.06); });
    if (wave > 0) {
      const elapsed = 2.5 - wave;
      const lift = reduced ? 1 : THREE.MathUtils.smoothstep(elapsed, 0, 0.4) * THREE.MathUtils.smoothstep(wave, 0, 0.4);
      // Positive Z raises the right hand outward, away from the face/headphones.
      const angle = 2.05 + (reduced ? 0 : Math.sin(elapsed * 9) * 0.12);
      arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, -0.25, lift);
      arms[1].rotation.z = THREE.MathUtils.lerp(arms[1].rotation.z, angle, lift);
      status("住客向你挥手");
    }
    legs.forEach(({ hip, knee, calf, foot }, i) => {
      hip.rotation.x = -Math.PI / 2 * sit + (i ? -swing : swing); knee.rotation.x = Math.PI / 2 * sit;
      // Extend the relaxed trouser silhouette to meet this room's unusually high sofa seat.
      calf.scale.y = 1 + sit * 0.9; calf.position.y = -0.15 - sit * 0.15;
      foot.position.y = -0.35 - sit * 0.32;
    });
    shadow.visible = sit < 0.2;
  }
  return { root, body, command, tick,
    dress(type:RoomType) {
      const colors = type === "rooftop" ? ["#586476", "#343335", "#e9ddc8"] : type === "cloud" ? ["#e9ddc8", "#99a8b9", "#a49a8e"] : ["#555d36", "#45372f", "#30241f"];
      colors.forEach((color,i)=>mats[5+i].color.set(color)); jacketOpening.visible=type==="rooftop";
    },
    setVisible(value: boolean) { hidden = !value; root.visible = value; },
    dispose() { geometry.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); shadowMat.dispose(); },
  };
}
