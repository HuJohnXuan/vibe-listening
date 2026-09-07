import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { RoomMood } from "../../core/vibe/build-listening-atmosphere.ts";
import { isRoomClick, type RoomAction } from "../../core/vibe/room-interactions.ts";

export interface RoomState {
  room: RoomMood;
  isPlaying: boolean;
  coverUrl: string;
  lampOn?: boolean;
  fireOn?: boolean;
}

/** A locally modelled listening room. No remote models, textures or user data. */
export function createRoomScene(host: HTMLDivElement, initial: RoomState, onFailure: () => void,
  onAction: (action: RoomAction) => void, onHover: (action: RoomAction | null) => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.setClearColor(0x201510, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  const home = new THREE.Vector3(9.6, 8.2, 12.8);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.25, 0);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minAzimuthAngle = 0.1;
  controls.maxAzimuthAngle = 1.2;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.25;
  controls.update();

  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  const material = (color: string, roughness = 0.8, metalness = 0) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(result);
    return result;
  };
  const walnut = material("#513021");
  const oak = material("#996442");
  const plaster = material("#a18b72");
  const dark = material("#171714");
  const brass = material("#c39b55", 0.32, 0.72);
  const cream = material("#ead8b3");
  const sofaFabric = material("#9b5f38");
  const green = material("#455640");
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material = walnut, parent: THREE.Object3D = scene) =>
    mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
  const soft = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material = sofaFabric, parent: THREE.Object3D = scene) =>
    mesh(new RoundedBoxGeometry(w, h, d, 3, 0.09), mat, x, y, z, parent);
  const cylinder = (top: number, bottom: number, height: number, x: number, y: number, z: number, mat: THREE.Material = brass, parent: THREE.Object3D = scene) =>
    mesh(new THREE.CylinderGeometry(top, bottom, height, 32), mat, x, y, z, parent);

  // Open-front room: real floor thickness, individual boards, plaster and wainscot.
  box(8.25, 0.25, 6.3, 0, -0.18, 0);
  const floorMats = ["#906347", "#835638", "#986c4a", "#a0714f"].map(c => material(c));
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 4; col++) {
      box(1.98, 0.07, 0.39, -3 + col * 2, -0.02, -2.8 + row * 0.4, floorMats[(row + col * 3) % 4]);
    }
  }
  box(0.18, 3.9, 6.1, -4.02, 1.9, 0, plaster);
  box(8.1, 3.9, 0.18, 0, 1.9, -3.04, plaster);
  box(8.1, 0.13, 0.15, 0, 0.08, -2.9, walnut);
  box(0.15, 0.13, 6, -3.9, 0.08, 0, walnut);
  box(8, 0.1, 0.12, 0, 1.03, -2.91, oak);
  box(0.12, 0.1, 6, -3.91, 1.03, 0, oak);
  for (let i = 0; i < 20; i++) box(0.04, 0.92, 0.04, -3.8 + i * 0.4, 0.53, -2.92, oak);
  for (let i = 0; i < 15; i++) box(0.04, 0.92, 0.04, -3.92, 0.53, -2.8 + i * 0.4, oak);

  // Tall window: luminous sky beyond wooden mullions, with local weather particles.
  const skyMat = new THREE.MeshBasicMaterial({ color: initial.room.sky });
  materials.add(skyMat);
  box(2.55, 2.35, 0.07, 0.65, 2.2, -2.91, skyMat);
  for (const x of [-0.69, 0.65, 1.99]) box(0.09, 2.57, 0.2, x, 2.2, -2.79, walnut);
  for (const y of [0.94, 2.2, 3.46]) box(2.8, 0.09, 0.2, 0.65, y, -2.79, walnut);
  box(3.05, 0.13, 0.45, 0.65, 0.91, -2.66, oak);
  // City silhouettes are behind the glass; the scene never needs a downloaded sky.
  for (let i = 0; i < 10; i++) {
    const h = 0.25 + ((i * 7) % 5) * 0.1;
    box(0.18, h, 0.02, -0.43 + i * 0.24, 1.04 + h / 2, -2.85, dark);
  }
  const curtainMat = material("#c5b392");
  for (const edge of [-1, 2.3]) {
    for (let i = 0; i < 5; i++) {
      const curtain = cylinder(0.09, 0.12, 2.65, edge + i * 0.085, 2.05, -2.62 + Math.sin(i * 1.6) * 0.06, curtainMat);
      curtain.scale.z = 0.55;
    }
  }
  const rod = cylinder(0.028, 0.028, 3.8, 0.65, 3.47, -2.57);
  rod.rotation.z = Math.PI / 2;

  const weather = new THREE.Group();
  scene.add(weather);
  const weatherMat = new THREE.MeshBasicMaterial({ color: "#f4ece0", transparent: true, opacity: 0.72 });
  materials.add(weatherMat);
  const drops: THREE.Mesh[] = [];
  for (let i = 0; i < 45; i++) {
    drops.push(box(0.012, 0.13, 0.012, -0.55 + ((i * 37) % 100) / 40, 1.05 + ((i * 23) % 100) / 44, -2.73, weatherMat, weather));
  }

  // A low fireplace beside the window, mantel and small framed print.
  const stone = material("#786452");
  box(1.8, 1.48, 0.48, -2.45, 0.75, -2.6, stone);
  box(1.32, 1.02, 0.1, -2.45, 0.59, -2.32, dark);
  box(2.05, 0.15, 0.74, -2.45, 1.53, -2.57, walnut);
  box(2, 0.12, 0.85, -2.45, 0.09, -2.4, stone);
  const emberMat = material("#ed6d2e");
  emberMat.emissive.set("#ff7b30");
  emberMat.emissiveIntensity = 2;
  const flames = new THREE.Group();
  scene.add(flames);
  for (let i = 0; i < 5; i++) {
    const flame = mesh(new THREE.SphereGeometry(0.1, 12, 12), emberMat, -2.88 + i * 0.21, 0.39, -2.21, flames);
    flame.scale.set(0.8, 1.7 + (i % 3) * 0.45, 0.45);
  }
  for (const x of [-2.75, -2.2]) {
    const log = cylinder(0.065, 0.065, 0.7, x, 0.22, -2.16, walnut);
    log.rotation.z = Math.PI / 2;
  }
  box(1.13, 1.3, 0.08, -2.45, 2.6, -2.87, walnut);
  box(0.98, 1.15, 0.03, -2.45, 2.6, -2.8, cream);
  const artMat = material("#a25f34");
  const sun = mesh(new THREE.CircleGeometry(0.31, 40), artMat, -2.45, 2.73, -2.775);
  sun.castShadow = false;
  box(0.77, 0.06, 0.025, -2.45, 2.25, -2.76, walnut);

  // Upholstered sofa, cushions and draped throw. Groups give the furniture depth.
  const couch = new THREE.Group();
  couch.position.set(-2.55, 0, 0.6);
  couch.rotation.y = Math.PI / 2;
  scene.add(couch);
  for (const x of [-1.13, 1.13]) for (const z of [-0.43, 0.43]) cylinder(0.065, 0.05, 0.3, x, 0.18, z, walnut, couch);
  soft(2.75, 0.38, 1.15, 0, 0.45, 0, sofaFabric, couch);
  soft(2.65, 0.9, 0.26, 0, 0.94, -0.48, sofaFabric, couch);
  for (const x of [-1.29, 1.29]) soft(0.27, 0.57, 1.2, x, 0.8, 0, sofaFabric, couch);
  for (const x of [-0.61, 0.61]) soft(1.15, 0.21, 0.91, x, 0.71, 0.05, sofaFabric, couch);
  const cushion = soft(0.55, 0.52, 0.19, -0.78, 1.05, -0.17, cream, couch);
  cushion.rotation.z = 0.16;
  const otherCushion = soft(0.52, 0.48, 0.2, 0.73, 1.04, -0.14, green, couch);
  otherCushion.rotation.z = -0.16;
  soft(0.54, 0.045, 0.84, 0.8, 0.85, 0.17, cream, couch);

  // Woven rug and an oval coffee table.
  const rugMat = material("#baa486");
  soft(3.3, 0.045, 3.15, -0.1, 0.04, 0.75, rugMat);
  for (let i = 0; i < 12; i++) box(3.07, 0.007, 0.016, -0.1, 0.067, -0.6 + i * 0.25, cream);
  const tableTop = cylinder(0.76, 0.76, 0.09, -0.15, 0.65, 0.65, oak);
  tableTop.scale.x = 1.35;
  for (const [x, z] of [[-0.75, 0.25], [0.5, 0.25], [-0.1, 1.15]]) cylinder(0.043, 0.065, 0.58, x, 0.31, z, walnut);
  box(0.37, 0.045, 0.47, -0.45, 0.72, 0.5, green);
  box(0.36, 0.028, 0.46, -0.42, 0.76, 0.52, cream);
  cylinder(0.105, 0.08, 0.15, 0.28, 0.76, 0.9, cream);
  cylinder(0.082, 0.082, 0.004, 0.28, 0.839, 0.9, walnut);

  // Record console: speakers, 3D spinning vinyl and a raised tonearm.
  box(2.7, 0.14, 0.88, 2.32, 1.01, -1.45, oak);
  box(2.7, 0.12, 0.88, 2.32, 0.37, -1.45);
  for (const x of [1.02, 2.33, 3.62]) box(0.1, 0.62, 0.86, x, 0.69, -1.45);
  for (const x of [1.08, 3.58]) for (const z of [-1.74, -1.15]) cylinder(0.04, 0.035, 0.28, x, 0.17, z, walnut);
  const sleeves = [green, cream, artMat, brass, dark];
  for (let i = 0; i < 18; i++) {
    const sleeve = box(0.04, 0.42 + (i % 3) * 0.025, 0.48, 1.2 + i * 0.053, 0.63, -1.3, sleeves[i % sleeves.length]);
    sleeve.rotation.z = -0.04;
  }
  for (const x of [1.28, 3.38]) {
    box(0.38, 0.61, 0.39, x, 1.39, -1.5, dark);
    for (const y of [1.28, 1.52]) {
      const cone = cylinder(y === 1.28 ? 0.115 : 0.065, 0.11, 0.025, x, y, -1.29, brass);
      cone.rotation.x = Math.PI / 2;
    }
  }
  box(1.05, 0.12, 0.67, 2.32, 1.15, -1.4, walnut);
  const vinyl = cylinder(0.28, 0.28, 0.025, 2.18, 1.225, -1.39, dark);
  for (const r of [0.2, 0.225, 0.25]) {
    const ring = mesh(new THREE.TorusGeometry(r, 0.002, 4, 48), material("#38332b"), 0, 0.016, 0, vinyl);
    ring.rotation.x = Math.PI / 2;
  }
  const coverMat = new THREE.MeshStandardMaterial({ color: "#dba968", roughness: 0.7 });
  materials.add(coverMat);
  const label = mesh(new THREE.CircleGeometry(0.095, 32), coverMat, 0, 0.02, 0, vinyl);
  label.rotation.x = -Math.PI / 2;
  cylinder(0.012, 0.012, 0.04, 2.18, 1.258, -1.39);
  const tonearm = new THREE.Group();
  tonearm.position.set(2.69, 1.27, -1.58);
  scene.add(tonearm);
  cylinder(0.025, 0.025, 0.1, 0, 0, 0, brass, tonearm);
  const arm = cylinder(0.012, 0.012, 0.42, 0, 0.06, 0.19, brass, tonearm);
  arm.rotation.x = Math.PI / 2;
  box(0.055, 0.025, 0.08, 0, 0.04, 0.41, cream, tonearm);

  // Floor lamp, plant and wall-mounted record shelves.
  cylinder(0.23, 0.26, 0.06, -2.85, 0.08, 2.12, dark);
  cylinder(0.025, 0.025, 2.25, -2.85, 1.21, 2.12);
  const shadeMat = material("#f2d5a3");
  shadeMat.emissive.set("#f4b85f");
  shadeMat.emissiveIntensity = 0.28;
  cylinder(0.26, 0.44, 0.52, -2.85, 2.33, 2.12, shadeMat);
  const lamp = new THREE.PointLight("#ffbe74", 18, 7, 2);
  lamp.position.set(-2.85, 2.12, 2.12);
  scene.add(lamp);
  cylinder(0.25, 0.19, 0.46, 3.24, 0.28, 1.85, cream);
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4;
    const x = 3.24 + Math.cos(a) * 0.28;
    const z = 1.85 + Math.sin(a) * 0.28;
    const leaf = mesh(new THREE.SphereGeometry(0.18, 12, 10), green, x, 0.7 + (i % 4) * 0.2, z);
    leaf.scale.set(0.45, 1.8, 0.85);
    leaf.rotation.z = Math.cos(a) * 0.5;
    cylinder(0.008, 0.012, 0.75, x, 0.63, z, green);
  }
  for (const y of [2.45, 3.05]) {
    box(0.36, 0.07, 1.62, -3.72, y, 0.55, oak);
    for (let i = 0; i < 6; i++) box(0.25, 0.33 + (i % 2) * 0.08, 0.08, -3.72, y + 0.23, -0.06 + i * 0.21, sleeves[i % 5]);
  }

  scene.add(new THREE.HemisphereLight("#ffe6bf", "#513a29", 2.1));
  const keyLight = new THREE.DirectionalLight("#ffddb0", 3);
  keyLight.position.set(1, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.1, far: 25 });
  keyLight.shadow.normalBias = 0.035;
  scene.add(keyLight);
  const windowLight = new THREE.PointLight(initial.room.light, 12, 9, 2);
  windowLight.position.set(0.65, 2.3, -1.85);
  scene.add(windowLight);
  const fireLight = new THREE.PointLight("#ff993f", 9, 5, 2);
  fireLight.position.set(-2.45, 0.7, -1.95);
  scene.add(fireLight);

  // Generous invisible hit volumes keep small furnishings easy to operate.
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  materials.add(hitMaterial);
  const targets = [
    { action: "record" as const, mesh: box(1.16, 0.3, 0.82, 2.32, 1.25, -1.4, hitMaterial) },
    { action: "lamp" as const, mesh: box(0.95, 2.75, 0.95, -2.85, 1.36, 2.12, hitMaterial) },
    { action: "fire" as const, mesh: box(2.05, 1.65, 0.8, -2.45, 0.84, -2.5, hitMaterial) },
    { action: "window" as const, mesh: box(2.8, 2.6, 0.23, 0.65, 2.2, -2.75, hitMaterial) },
  ];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function pick(event: PointerEvent): RoomAction | null {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(targets.map(target => target.mesh), false)[0];
    return targets.find(target => target.mesh === hit?.object)?.action ?? null;
  }
  let pressed: { x: number; y: number; id: number; action: RoomAction | null } | null = null;
  let dragged = false;
  let hovered: RoomAction | null = null;
  function hover(action: RoomAction | null) {
    renderer.domElement.style.cursor = action ? "pointer" : "grab";
    if (hovered !== action) { hovered = action; onHover(action); }
  }
  function pointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) { pressed = null; return; }
    pressed = { x: event.clientX, y: event.clientY, id: event.pointerId, action: pick(event) };
    dragged = false;
  }
  function pointerMove(event: PointerEvent) {
    if (pressed && !isRoomClick(pressed, { x: event.clientX, y: event.clientY })) dragged = true;
    hover(pressed ? null : pick(event));
  }
  function pointerUp(event: PointerEvent) {
    const start = pressed;
    pressed = null;
    if (!start || start.id !== event.pointerId || dragged || !isRoomClick(start, { x: event.clientX, y: event.clientY })) return;
    const action = pick(event);
    if (action && action === start.action) onAction(action);
    hover(action);
  }
  function pointerCancel() { pressed = null; hover(null); }
  function pointerLeave() { hover(null); }
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerCancel);
  canvas.addEventListener("pointerleave", pointerLeave);

  let state = initial;
  let disposed = false;
  let textureRequest = 0;
  let loadedCover = "";
  const loader = new THREE.TextureLoader();
  const targetSky = new THREE.Color(state.room.sky);
  const targetLight = new THREE.Color(state.room.light);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let last = 0;
  let time = 0;
  let dirty = true;
  let visible = true;
  let enabled = true;
  function update(next: RoomState) {
    state = next;
    dirty = true;
    lamp.intensity = next.lampOn === false ? 0 : 18;
    shadeMat.emissiveIntensity = next.lampOn === false ? 0 : 0.28;
    flames.visible = next.fireOn !== false;
    fireLight.intensity = next.fireOn === false ? 0 : 8;
    targetSky.set(next.room.sky);
    targetLight.set(next.room.light);
    weather.visible = next.room.weather !== "clear";
    for (const drop of drops) drop.scale.set(next.room.weather === "snow" ? 2.8 : 1, next.room.weather === "snow" ? 0.25 : 1, 1);
    if (loadedCover === next.coverUrl) return;
    loadedCover = next.coverUrl;
    const request = ++textureRequest;
    loader.load(next.coverUrl, texture => {
      if (disposed || request !== textureRequest) { texture.dispose(); return; }
      if (coverMat.map) { textures.delete(coverMat.map); coverMat.map.dispose(); }
      texture.colorSpace = THREE.SRGBColorSpace;
      coverMat.color.set("#ffffff");
      coverMat.map = texture;
      textures.add(texture);
      coverMat.needsUpdate = true;
      dirty = true;
    }, undefined, () => { /* Keep the cream record label if its cover cannot load. */ });
  }
  function draw(timestamp: number) {
    frame = requestAnimationFrame(draw);
    if (!enabled || !visible || document.hidden || timestamp - last < 1000 / 30) return;
    const dt = Math.min((timestamp - last) / 1000, 0.1);
    last = timestamp;
    if (motion.matches && !dirty) return;
    time += dt;
    const blend = motion.matches ? 1 : 1 - Math.exp(-dt * 4);
    skyMat.color.lerp(targetSky, blend);
    windowLight.color.lerp(targetLight, blend);
    keyLight.color.lerp(targetLight, blend);
    keyLight.intensity = THREE.MathUtils.lerp(keyLight.intensity, state.room.intensity * 1.65, blend);
    tonearm.rotation.y = THREE.MathUtils.lerp(tonearm.rotation.y, state.isPlaying ? -0.62 : 0, blend);
    if (!motion.matches) {
      if (state.isPlaying) vinyl.rotation.y -= dt * 3.49;
      flames.children.forEach((flame, i) => { flame.scale.y = 1.8 + Math.sin(time * 3 + i * 1.3) * 0.45; });
      fireLight.intensity = state.fireOn === false ? 0 : 8 + Math.sin(time * 3) * 0.55;
      if (weather.visible) drops.forEach((drop, i) => {
        drop.position.y -= dt * (state.room.weather === "rain" ? 1.9 : 0.35);
        if (drop.position.y < 1.03) drop.position.y = 3.32;
        drop.position.x = -0.55 + ((i * 37) % 100) / 40 + (state.room.weather === "snow" ? Math.sin(time + i) * 0.035 : 0);
      });
    }
    renderer.render(scene, camera);
    dirty = false;
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    // Keep the whole room visible in both tall and wide panels.
    camera.fov = camera.aspect < 1.1 ? 45 : 38;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; dirty = true; });
  intersection.observe(host);
  const invalidate = () => { dirty = true; };
  controls.addEventListener("change", invalidate);
  motion.addEventListener("change", invalidate);
  const contextLost = (event: Event) => { event.preventDefault(); onFailure(); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  update(initial);
  resize();
  frame = requestAnimationFrame(draw);
  return {
    update,
    setVisible(value: boolean) { enabled = value; dirty = true; },
    view(direction: number) {
      camera.position.copy(home).applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * 0.23);
      controls.update();
      dirty = true;
    },
    dispose() {
      disposed = true;
      textureRequest++;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      motion.removeEventListener("change", invalidate);
      controls.dispose();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerCancel);
      canvas.removeEventListener("pointerleave", pointerLeave);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      textures.forEach(t => t.dispose());
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
